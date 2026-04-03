import hashlib
import io
import os
import re
from datetime import datetime

import psycopg
from psycopg import sql
from psycopg.types.json import Jsonb

from .items import CarItem, SellerItem


class ScreenshotPipeline:
    """Compresses screenshots to WebP, deduplicates via MD5, and uploads to Cloudflare R2."""

    def __init__(self, crawler):
        self.crawler = crawler
        self.s3_client = None
        self.connection = None
        self.r2_configured = all(os.environ.get(k) for k in (
            'R2_ENDPOINT_URL', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY',
            'R2_BUCKET_NAME', 'R2_PUBLIC_URL'
        ))
        self.bucket_name = os.environ.get('R2_BUCKET_NAME')
        self.public_url = (os.environ.get('R2_PUBLIC_URL') or '').rstrip('/')

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler)

    def open_spider(self):
        if not self.r2_configured:
            self.crawler.spider.logger.warning('R2 not configured — screenshots will not be uploaded')

    def close_spider(self):
        if self.connection:
            self.connection.close()

    def process_item(self, item):
        if not isinstance(item, CarItem):
            return item

        screenshot_data = item.pop('screenshot', None)
        item['screenshot_id'] = None

        if not screenshot_data or not self.r2_configured:
            return item

        try:
            self._ensure_clients()
            webp_data, width, height, original_size = self._compress(screenshot_data)
            compressed_size = len(webp_data)
            md5_hash = hashlib.md5(webp_data).hexdigest()

            with self.connection.transaction():
                with self.connection.cursor() as cursor:
                    cursor.execute('SELECT id FROM screenshots WHERE md5_hash = %s', (md5_hash,))
                    existing = cursor.fetchone()

                    if existing:
                        item['screenshot_id'] = existing[0]
                        self.crawler.spider.logger.info(
                            f'Screenshot for {item["vehicle_id"]}: dedup hit (hash={md5_hash[:8]})')
                    else:
                        search_name = re.sub(r'\W+', '_', self.crawler.spider.search_name).lower().strip('_')
                        timestamp = datetime.now().strftime('%Y-%m-%dT%H-%M-%SZ')
                        r2_key = f'screenshots/{search_name}/{item["vehicle_id"]}/{timestamp}.webp'
                        r2_url = f'{self.public_url}/{r2_key}'

                        self.s3_client.put_object(
                            Bucket=self.bucket_name,
                            Key=r2_key,
                            Body=webp_data,
                            ContentType='image/webp',
                        )

                        cursor.execute('''
                            INSERT INTO screenshots (md5_hash, r2_key, r2_url, format, width, height, original_size, compressed_size)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                            RETURNING id
                        ''', (md5_hash, r2_key, r2_url, 'webp', width, height, original_size, compressed_size))
                        item['screenshot_id'] = cursor.fetchone()[0]

                        self.crawler.spider.logger.info(
                            f'Screenshot for {item["vehicle_id"]}: '
                            f'{original_size / 1024:.0f}KB → {compressed_size / 1024:.0f}KB '
                            f'({compressed_size / original_size * 100:.0f}%), hash={md5_hash[:8]}')
        except Exception as e:
            self.crawler.spider.logger.error(f'Screenshot processing failed for {item.get("vehicle_id")}: {e}')

        return item

    def _ensure_clients(self):
        if self.s3_client is None:
            import boto3
            self.s3_client = boto3.client(
                's3',
                endpoint_url=os.environ['R2_ENDPOINT_URL'],
                aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
                region_name='auto',
            )
        if self.connection is None:
            self.connection = psycopg.connect(os.environ['PGSQL_URL'], connect_timeout=1)

    @staticmethod
    def _compress(png_data):
        from PIL import Image
        img = Image.open(io.BytesIO(png_data))
        width, height = img.size
        webp_buffer = io.BytesIO()
        img.save(webp_buffer, format='WebP', quality=80)
        return webp_buffer.getvalue(), width, height, len(png_data)


class PostgreSQLPipeline:

    def __init__(self, crawler):
        self.crawler = crawler
        self.connection = None

        self.batch_size = 1000
        self.car_buffer = []
        self.seller_buffer = []
        self.cars_inserted = 0
        self.sellers_inserted = 0

    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler)

    def close_spider(self):
        """Flush any remaining items in buffers and close database connection when spider finishes."""
        try:
            self.flush_buffers()
        except Exception as e:
            self.crawler.spider.logger.error(f'Database error: {e}', exc_info=True)
            raise
        finally:
            if self.connection:
                self.connection.close()
                self.crawler.spider.logger.info('Database connection closed')

    def process_item(self, item):
        """Buffer items and flush to database in batches for better performance."""
        if isinstance(item, SellerItem):
            self.seller_buffer.append(dict(item))
        if isinstance(item, CarItem):
            self.car_buffer.append(dict(item))

        if len(self.seller_buffer) >= self.batch_size or len(self.car_buffer) >= self.batch_size:
            self.flush_buffers()

        return item

    def _ensure_connection(self):
        """Establish a database connection if not already done."""
        if self.connection:
            return

        self.connection = psycopg.connect(os.environ['PGSQL_URL'], connect_timeout=1)

    def flush_buffers(self):
        """Insert buffered items into the database and clear buffers. This is called when buffers reach batch size or when spider closes."""
        if not self.seller_buffer and not self.car_buffer:
            return

        search_run_id = self.crawler.stats.get_value('search_run_id')
        self._ensure_connection()
        with self.connection.transaction():
            with self.connection.cursor() as cursor:
                if self.seller_buffer:
                    insert_query = sql.SQL('''
                        INSERT INTO sellers (id, type, name, address, zip_code, city)
                        VALUES (%(id)s, %(type)s, %(name)s, %(address)s, %(zip_code)s, %(city)s)
                        ON CONFLICT (id) DO NOTHING
                    ''')

                    cursor.executemany(insert_query, self.seller_buffer)
                    self.sellers_inserted += cursor.rowcount
                    self.crawler.stats.set_value('db/sellers_inserted', self.sellers_inserted)
                    self.crawler.spider.logger.info(f'{cursor.rowcount} of {len(self.seller_buffer)} sellers inserted into database')
                    self.seller_buffer.clear()

                if self.car_buffer:
                    insert_query = sql.SQL('''
                        INSERT INTO cars(search_run_id,search_id,url,json_data,title,subtitle,description,vehicle_id,seller_vehicle_id,certification_number,price,body_type,color,mileage,has_additional_set_of_tires,had_accident,fuel_type,kilo_watts,cm3,cylinders,cylinder_layout,avg_consumption,co2_emission,warranty,leasing,created_date,last_modified_date,first_registration_date,last_inspection_date,seller_id,screenshot_id)
                        VALUES(%(search_run_id)s,%(search_id)s,%(url)s,%(json_data)s,%(title)s,%(subtitle)s,%(description)s,%(vehicle_id)s,%(seller_vehicle_id)s,%(certification_number)s,%(price)s,%(body_type)s,%(color)s,%(mileage)s,%(has_additional_set_of_tires)s,%(had_accident)s,%(fuel_type)s,%(kilo_watts)s,%(cm3)s,%(cylinders)s,%(cylinder_layout)s,%(avg_consumption)s,%(co2_emission)s,%(warranty)s,%(leasing)s,%(created_date)s,%(last_modified_date)s,%(first_registration_date)s,%(last_inspection_date)s,%(seller_id)s,%(screenshot_id)s)
                    ''')

                    for car in self.car_buffer:
                        car['search_run_id'] = search_run_id
                        car['json_data'] = Jsonb(car['json_data'])
                        car.setdefault('screenshot_id', None)
                        car.pop('screenshot', None)

                    cursor.executemany(insert_query, self.car_buffer)
                    self.cars_inserted += cursor.rowcount
                    self.crawler.stats.set_value('db/cars_inserted', self.cars_inserted)
                    self.crawler.spider.logger.info(f'{cursor.rowcount} of {len(self.car_buffer)} cars inserted into database')
                    self.car_buffer.clear()


class ItemTypeStatsPipeline:
    def __init__(self, stats):
        self.stats = stats

    @classmethod
    def from_crawler(cls, crawler):
        return cls(stats=crawler.stats)

    def process_item(self, item):
        item_type = type(item).__name__
        self.stats.inc_value(f'item_scraped_count/{item_type}')
        return item
