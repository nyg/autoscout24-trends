import json
from os import path
from urllib.parse import urlencode

import njsparser
from dotenv import dotenv_values
from scrapy import Spider, Request
from scrapy_seleniumbase import SeleniumBaseRequest

from autoscout.items import CarItem, SellerItem

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC


class SearchSpider(Spider):
    name = 'search'
    allowed_domains = ['www.autoscout24.ch', 'autoscout24.ch']

    def __init__(self, config_file, *args, **kwargs):
        super().__init__(*args, **kwargs)

        filepath = path.join('searches', config_file)
        if not path.exists(filepath):
            raise FileNotFoundError(f'Search file {filepath} could not be found')

        search_config = dotenv_values(filepath)
        if any(k not in search_config for k in ('name', 'emails', 'url')):
            raise ValueError('Missing keys in search file, check example')

        self.search_name = search_config['name']
        self.emails = [e.strip() for e in search_config['emails'].split(',')]
        self.url = search_config['url']

    async def start(self):
        yield SeleniumBaseRequest(url=self.build_url(), callback=self.parse, meta={'page': 0}, wait_time=10, wait_until=EC.element_to_be_clickable((By.TAG_NAME, 'h1')))

    def parse(self, response, **kwargs):
        self.logger.info(f'Parsing page: {response.meta.get('page')}')

        # for each car url, call parse_car
        for car_url in response.xpath('//a[contains(@data-testid, "listing-card-")]/@href').getall():
            self.logger.info(f'Car found: {car_url}')
            yield SeleniumBaseRequest(url=response.urljoin(car_url), callback=self.parse_car, wait_time=10, wait_until=EC.element_to_be_clickable((By.TAG_NAME, 'h1')))

        # fetch next page, if any
        go_to_page_links = response.xpath('//button[contains(@aria-label, "go to page")]').getall()
        page_count = len(go_to_page_links) if go_to_page_links else 1
        next_page = response.meta.get('page') + 1

        if next_page < page_count:
            self.logger.info(f'Next page: {next_page}')
            yield SeleniumBaseRequest(url=self.build_url(next_page), callback=self.parse, meta={'page': next_page}, wait_time=10, wait_until=EC.element_to_be_clickable((By.TAG_NAME, 'h1')))

    def parse_car(self, response):
        fd = njsparser.BeautifulFD(response.body)
        for data in fd.find_iter([njsparser.T.Data]):
            if 'children' in data.content and 'referer' in data.content:
                page_view_tracking = data.content['children'][3]['children'][3]['children'][3]['pageViewTracking']
                listing = data.content['children'][3]['children'][3]['children'][3]['children'][1][3]['children'][0][3]['listing']
                seller = data.content['children'][3]['children'][3]['children'][3]['children'][1][3]['children'][0][3]['seller']

                yield SellerItem.parse_response(seller)
                yield CarItem.parse_response(self.search_name, response.url, {'pageViewTracking': page_view_tracking, 'listing': listing, 'seller': seller})

    def build_url(self, page=0):
        return f'{self.url}&{urlencode({'pagination[page]': page})}'
