import os
from pathlib import Path
from textwrap import dedent
from typing import Any, cast

import resend
from jinja2 import Template
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
