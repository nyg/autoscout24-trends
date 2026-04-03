import os
from pathlib import Path
from textwrap import dedent
from typing import Any, cast

import psycopg
import resend
from jinja2 import Template
from psycopg.types.json import Jsonb
from resend import Emails
from scrapy import signals
from scrapy.crawler import Crawler
from scrapy.extensions.feedexport import FeedSlot

from .spiders.search import SearchSpider

template = Template(lstrip_blocks=True, trim_blocks=True, source=dedent('''
    {% if not stats.cars_scraped %}
    No cars scraped, check logs for errors or change search parameters.
    {% else %}
    {{ stats.cars_scraped }} car(s) and {{ stats.sellers_scraped }} seller(s) scraped.
    See attached file for results.
    {% endif %}
    {% if stats.failed_requests or stats.error_logs %}

    Warnings:
    - {{ stats.failed_requests }} request(s) failed
    - {{ stats.error_logs }} error log(s)
    {% endif %}

    --- Crawler stats ---
    Start time     {{ stats.start_time.strftime('%d-%m-%Y %H:%M:%S') }}
    Finish time    {{ stats.finish_time.strftime('%d-%m-%Y %H:%M:%S') }}
    Time elapsed   {{ stats.elapsed_time | round(1) }} seconds
    {% for status_code, count in stats.responses_by_status.items() %}
    Responses/{{ status_code }}  {{ count }}
    {% endfor %}
    Status         {{ stats.status }}
''').strip())


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
            error_count = stats.get('log_count/ERROR', 0)
            finish_reason = stats.get('finish_reason', 'unknown')
            success = finish_reason == 'finished' and failed_request_count == 0 and error_count == 0

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


class EmailAfterFeedExport:

    def __init__(self, spider: SearchSpider, stats: dict[str, Any]):
        self.spider: SearchSpider = spider
        self.stats: dict[str, Any] = stats
        resend.api_key = os.environ.get('RESEND_API_KEY', '')

    @classmethod
    def from_crawler(cls, crawler: Crawler):
        spider = cast(SearchSpider, crawler.spider)
        extension = cls(spider, crawler.stats.get_stats())
        crawler.signals.connect(extension.output_file_written, signal=signals.feed_slot_closed)
        return extension

    def output_file_written(self, slot: FeedSlot):
        self.spider.logger.info('Per-search email disabled, skipping')

    @staticmethod
    def _create_attachments(filepath):
        file = Path(filepath)
        if not file.exists() or file.stat().st_size == 0:
            return []

        with file.open('rb') as f:
            attachment_content = f.read()

        return [{'content': list(attachment_content), 'filename': file.name}]
