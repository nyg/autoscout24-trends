import json
from os.path import join
from urllib.parse import urlencode

from dotenv import dotenv_values
from scrapy import Spider, Request

from autoscout.items import CarItem, SellerItem


class SearchSpider(Spider):
    name = 'search'
    allowed_domains = ['autoscout24.ch']

    def __init__(self, config_file, *args, **kwargs):
        super().__init__(*args, **kwargs)

        search_config = dotenv_values(join('searches', config_file))
        self.search_name = search_config['name']
        self.emails = [e.strip() for e in search_config['emails'].split(',')]
        self.url = search_config['url']

    async def start(self):
        yield Request(url=self.build_url(), callback=self.parse, meta={'impersonate': 'chrome', 'page': 0})

    def parse(self, response, **kwargs):
        # for each car url, call parse_car
        for car_url in response.xpath('//a[contains(@data-testid, "listing-card-")]/@href'):
            self.logger.info(car_url.get())
            yield Request(url=response.urljoin(car_url.get()), callback=self.parse_car, meta={'impersonate': 'chrome'})

        # fetch next page, if any
        page_count = len(response.xpath('//button[contains(@aria-label, "go to page")]'))
        next_page = response.meta.get('page') + 1

        if next_page < page_count:
            self.logger.info(f'Next page: {next_page}')
            yield Request(url=self.build_url(next_page), callback=self.parse, meta={'impersonate': 'chrome', 'page': next_page})

    def parse_car(self, response):
        json_response = json.loads(response.xpath('//script[@id="__NEXT_DATA__"]/text()').get())['props']['pageProps']
        yield SellerItem.parse_response(json_response)
        yield CarItem.parse_response(self.search_name, response.url, json_response)

    def build_url(self, page=0):
        return f'{self.url}&{urlencode({'pagination[page]': page})}'
