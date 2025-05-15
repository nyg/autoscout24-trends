import logging
import os

import psycopg
from psycopg import sql


class AutoscoutPipeline:

    def __init__(self):
        self.logger = logging.getLogger(__name__)

        self.connection = None
        self.cursor = None

        self.batch_size = 100
        self.buffer = []

    def open_spider(self, spider):
        self.connection = psycopg.connect(os.environ['PGSQL_URL'], connect_timeout=1)
        self.cursor = self.connection.cursor()

    def process_item(self, item, spider):
        self.buffer.append((
            item.get('title'),
            item.get('subtitle'),
            item.get('mileage'),
            item.get('price'),
            item.get('registration_date'),
            item.get('seller'),
            item.get('location'),
            item.get('url')))

        if len(self.buffer) >= self.batch_size:
            self.flush_buffer()

        return item

    def close_spider(self, spider):
        self.flush_buffer()
        self.cursor.close()
        self.connection.close()

    def flush_buffer(self):
        if not self.buffer:
            return

        insert_query = sql.SQL('''
            INSERT INTO cars (title, subtitle, mileage, price, registration_date, seller, location, url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        ''')

        self.cursor.executemany(insert_query, self.buffer)
        self.connection.commit()
        self.logger.info(f'{len(self.buffer)} items inserted into database')
        self.buffer.clear()
