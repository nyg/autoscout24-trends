import logging
import os

import psycopg
from psycopg import sql
from psycopg.types.json import Jsonb

from autoscout.items import CarItem, SellerItem


class PostgreSQLPipeline:

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.connection = None
        self.batch_id = None

        self.batch_size = 1000
        self.car_buffer = []
        self.seller_buffer = []

    def open_spider(self, spider):
        self.connection = psycopg.connect(os.environ['PGSQL_URL'], connect_timeout=1)
        with self.connection.transaction():
            with self.connection.cursor() as cursor:
                (self.batch_id,) = cursor.execute("SELECT nextval('car_batch_id_seq')").fetchone()
                self.logger.info(f'Fetched batch_id sequence value: {self.batch_id}')

    def process_item(self, item, spider):
        if isinstance(item, SellerItem):
            self.seller_buffer.append(dict(item))
        if isinstance(item, CarItem):
            self.car_buffer.append(dict(item))

        if len(self.seller_buffer) >= self.batch_size or len(self.car_buffer) >= self.batch_size:
            self.flush_buffers()

        return item

    def flush_buffers(self):
        with self.connection.transaction():
            with self.connection.cursor() as cursor:
                if self.seller_buffer:
                    insert_query = sql.SQL('''
                        INSERT INTO sellers (id, type, name, address, zip_code, city)
                        VALUES (%(id)s, %(type)s, %(name)s, %(address)s, %(zip_code)s, %(city)s)
                        ON CONFLICT (id) DO NOTHING
                    ''')

                    cursor.executemany(insert_query, self.seller_buffer)
                    self.logger.info(f'{cursor.rowcount} of {len(self.seller_buffer)} sellers inserted into database')
                    self.seller_buffer.clear()

                if self.car_buffer:
                    insert_query = sql.SQL('''
                        INSERT INTO cars(batch_id,search_name,url,json_data,title,subtitle,description,vehicle_id,seller_vehicle_id,certification_number,price,body_type,color,mileage,has_additional_set_of_tires,had_accident,fuel_type,kilo_watts,cm3,cylinders,cylinder_layout,avg_consumption,co2_emission,warranty,leasing,created_date,last_modified_date,first_registration_date,last_inspection_date,seller_id)
                        VALUES(%(batch_id)s,%(search_name)s,%(url)s,%(json_data)s,%(title)s,%(subtitle)s,%(description)s,%(vehicle_id)s,%(seller_vehicle_id)s,%(certification_number)s,%(price)s,%(body_type)s,%(color)s,%(mileage)s,%(has_additional_set_of_tires)s,%(had_accident)s,%(fuel_type)s,%(kilo_watts)s,%(cm3)s,%(cylinders)s,%(cylinder_layout)s,%(avg_consumption)s,%(co2_emission)s,%(warranty)s,%(leasing)s,%(created_date)s,%(last_modified_date)s,%(first_registration_date)s,%(last_inspection_date)s,%(seller_id)s)
                    ''')

                    for car in self.car_buffer:
                        car['batch_id'] = self.batch_id
                        car['json_data'] = Jsonb(car['json_data'])

                    cursor.executemany(insert_query, self.car_buffer)
                    self.logger.info(f'{cursor.rowcount} of {len(self.car_buffer)} cars inserted into database')
                    self.car_buffer.clear()

    def close_spider(self, spider):
        try:
            self.flush_buffers()
        except Exception as e:
            self.logger.error(f'Database error: {e}', exc_info=True)
            raise
        finally:
            self.connection.close()
            self.logger.info('Database connection closed')


class ItemTypeStatsPipeline:
    def __init__(self, stats):
        self.stats = stats

    @classmethod
    def from_crawler(cls, crawler):
        return cls(stats=crawler.stats)

    def process_item(self, item, spider):
        item_type = type(item).__name__
        self.stats.inc_value(f'item_scraped_count/{item_type}')
        return item
