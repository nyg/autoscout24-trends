import os
from textwrap import dedent

import resend
from jinja2 import Template
from resend import Emails
from scrapy import signals

from .spiders.search import SearchSpider

output_filename = 'cars.csv'
template = Template(dedent('''
    {% if stats.get('item_scraped_count/CarItem', 0) == 0 %}
    No cars extracted, check logs for errors or change search parameters.
    {%- else %}
    {{ stats['item_scraped_count/CarItem'] }} car(s) extracted, please see the attached file.
    {% endif %}
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
        self.spider: SearchSpider | None = None
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
        if not self.spider.emails:
            self.spider.logger.info('No email address defined, not sending email')
            return

        failed_requests, responses_by_status = self.compute_stats()
        warning_subject = ' (cars missing!)' if failed_requests else ''

        email = Emails.send({
            'from': 'AutoScout24 Crawler <autscout24-crawler@resend.dev>',
            'to': self.spider.emails,
            'subject': f'Car extraction - {self.spider.search_name}{warning_subject}',
            'text': template.render(stats=self.stats.get_stats(), failed_requests=failed_requests, responses_by_status=responses_by_status),
            'attachments': self.create_attachments()
        })

        self.spider.logger.info(f'Email sent: {email}')

    def create_attachments(self):
        if not os.path.exists(output_filename) or os.stat(output_filename).st_size == 0:
            return []

        attachment_content = open(output_filename, 'rb').read()
        attachment_filename = f'extract-{self.spider.search_name.lower().replace(' ', '-')}.csv'
        return [{'content': list(attachment_content), 'filename': attachment_filename}]

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
