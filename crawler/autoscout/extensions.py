import logging
import os
from textwrap import dedent

import resend
from jinja2 import Template
from resend import Emails
from scrapy import signals

logger = logging.getLogger(__name__)

template = Template(dedent('''
    {{ stats['item_scraped_count/CarItem'] }} car(s) extracted, please see the attached file.
    {% if failed_requests %}
    Warning: {{ failed_requests }} request(s) failed!
    {% endif %}
    
    --- Extraction stats ---
    Start time     {{ stats.start_time.strftime('%d-%m-%Y %H:%M:%S') }}
    Finish time    {{ stats.finish_time.strftime('%d-%m-%Y %H:%M:%S') }}
    Time elapsed   {{ stats.elapsed_time_seconds | round(1) }} seconds
    Requests       {{ stats['downloader/request_count'] }}
    {%- for status_code, count in responses_by_status.items() %}
    Responses/{{ status_code }}  {{ count }}
    {%- endfor %}
    Status         {{ stats.finish_reason }}
''').strip())


class EmailAfterFeedExport:

    def __init__(self, stats):
        self.spider = None
        self.stats = stats
        resend.api_key = os.environ['RESEND_API_KEY']

    @classmethod
    def from_crawler(cls, crawler):
        ext = cls(crawler.stats)
        crawler.signals.connect(ext.spider_opened, signal=signals.spider_opened)
        crawler.signals.connect(ext.output_file_written, signal=signals.feed_exporter_closed)
        return ext

    def spider_opened(self, spider):
        self.spider = spider

    def output_file_written(self):
        failed_requests, responses_by_status = self.compute_stats()
        warning_subject = ' (cars missing!)' if failed_requests else ''

        email = Emails.send({
            'from': 'AutoScout24 Crawler <autscout24-crawler@resend.dev>',
            'to': self.spider.emails,
            'subject': f'Car extraction - {self.spider.search_name}{warning_subject}',
            'text': template.render(stats=self.stats.get_stats(), failed_requests=failed_requests, responses_by_status=responses_by_status),
            'attachments': self.create_attachments()
        })

        logger.info(f'Email sent: {email}')

    def create_attachments(self):
        filename = f'extract-{self.spider.search_name.lower().replace(' ', '-')}.csv'
        file = open('cars.csv', 'rb').read()
        return [{'content': list(file), 'filename': filename}]

    def compute_stats(self):
        failed_requests = 0
        responses_by_status = {}

        for key, value in self.stats.get_stats().items():
            if key.startswith('downloader/response_status_count/'):
                http_code = key.split('/')[2]
                responses_by_status[http_code] = value
                if http_code != '200':
                    failed_requests += value

        return failed_requests, responses_by_status
