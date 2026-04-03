import os

import psycopg
from psycopg.types.json import Jsonb
from scrapy import signals


class SearchRunExtension:
    """Records each spider run in the search_runs table with stats.

    Uses spider_opened/spider_closed signals (not pipeline open/close_spider)
    so that CoreStats has already set finish_time, finish_reason, etc.
    """

    def __init__(self, crawler):
        self.crawler = crawler
        self.connection = None
        self.search_run_id = None

    @classmethod
    def from_crawler(cls, crawler):
        ext = cls(crawler)
        crawler.signals.connect(ext.spider_opened, signal=signals.spider_opened)
        crawler.signals.connect(ext.spider_closed, signal=signals.spider_closed)
        return ext

    def spider_opened(self):
        """Create a search_runs row and publish search_run_id to Scrapy stats."""
        self.connection = psycopg.connect(os.environ['PGSQL_URL'], connect_timeout=1)
        with self.connection.transaction():
            with self.connection.cursor() as cursor:
                (self.search_run_id,) = cursor.execute(
                    'INSERT INTO search_runs (search_id, started_at) VALUES (%s, %s) RETURNING id',
                    (self.crawler.spider.search_id, self.crawler.stats.get_value('start_time'))
                ).fetchone()
        self.crawler.stats.set_value('search_run_id', self.search_run_id)
        self.crawler.spider.logger.info(f'Created search run {self.search_run_id}')

    def spider_closed(self):
        """Update the search_runs row with final stats."""
        try:
            stats = self.crawler.stats.get_stats()

            cars_scraped = stats.get('db/cars_inserted', 0)
            cars_found = self.crawler.spider.cars_found
            failed_request_count = len(self.crawler.spider.failed_requests)
            request_count = stats.get('response_received_count', 0)
            finish_reason = stats.get('finish_reason', 'unknown')
            success = cars_found == cars_scraped

            with self.connection.transaction():
                with self.connection.cursor() as cursor:
                    cursor.execute('''
                        UPDATE search_runs
                           SET finished_at = %s,
                               finish_reason = %s,
                               success = %s,
                               cars_found = %s,
                               cars_scraped = %s,
                               request_count = %s,
                               failed_request_count = %s,
                               stats = %s
                         WHERE id = %s
                    ''', (
                        stats.get('finish_time'),
                        finish_reason,
                        success,
                        cars_found,
                        cars_scraped,
                        request_count,
                        failed_request_count,
                        Jsonb({k: str(v) for k, v in stats.items()}),
                        self.search_run_id,
                    ))
            self.crawler.spider.logger.info(f'Updated search run {self.search_run_id}')
        except Exception as e:
            self.crawler.spider.logger.error(f'Failed to update search run: {e}', exc_info=True)
        finally:
            if self.connection:
                self.connection.close()
