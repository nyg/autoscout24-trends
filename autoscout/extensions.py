import logging
import os

import resend
from resend import Emails
from scrapy import signals

logger = logging.getLogger(__name__)


class EmailOnClose:

    def __init__(self):
        self.spider = None
        resend.api_key = os.environ['RESEND_API_KEY']

    @classmethod
    def from_crawler(cls, crawler):
        ext = cls()
        crawler.signals.connect(ext.spider_opened, signal=signals.spider_opened)
        crawler.signals.connect(ext.output_file_written, signal=signals.feed_exporter_closed)
        return ext

    def spider_opened(self, spider):
        self.spider = spider

    def output_file_written(self):
        filename = f'extract-{self.spider.description.lower().replace(' ', '-')}.csv'
        file = open('cars.csv', 'rb').read()
        attachments = [{'content': list(file), 'filename': filename}]

        email = Emails.send({
            'from': 'AutoScout24 Crawler <autscout24-crawler@resend.dev>',
            'to': self.spider.emails,
            'subject': f'Car extraction - {self.spider.description}',
            'text': f'Please see the attached file.',  # TODO include result of spider
            'attachments': attachments
        })

        logger.info(f'Email sent: {email}')
