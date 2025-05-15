from os.path import join
from urllib.parse import urlencode

from dotenv import dotenv_values
from scrapy import Spider, Request

from autoscout.items import CarItem
from autoscout.loaders import CarLoader


class SearchSpider(Spider):
    name = 'search'
    allowed_domains = ['autoscout24.ch']

    def __init__(self, config_file, *args, **kwargs):
        super().__init__(*args, **kwargs)

        config = dotenv_values(join('searches', config_file))
        self.description = config['description']
        self.emails = [e.strip() for e in config['emails'].split(',')]
        self.url = config['url']

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

    @staticmethod
    def parse_car(response):
        loader = CarLoader(item=CarItem(), response=response)

        loader.add_value('url', response.url)
        loader.add_xpath('title', '//main/div[3]/div[1]/h1/text()')
        loader.add_xpath('subtitle', '//main/div[3]/div[1]/p/text()', default=None)
        loader.add_xpath('registration_date', '//main/div[3]/div[3]/div/div[2]/div[1]/div/p/text()')
        loader.add_xpath('mileage', '//main/div[3]/div[3]/div/div[2]/div[3]/div/p/text()')
        loader.add_xpath('price', '//main/div[3]/div[2]/div/div[1]/div/p/text()')
        loader.add_xpath('location', '//a[@href="#seller-map"]/span/text()')

        garage_seller_xpath = '//main/div[3]/div[2]/div/div[5]/div/p/text()'
        private_seller_xpath = '//a[@href="#seller-map"]/../preceding-sibling::div[1]/p[2]/text()'
        seller = response.xpath(private_seller_xpath).get() or response.xpath(garage_seller_xpath).get()
        loader.add_value('seller', seller)

        yield loader.load_item()

    def build_url(self, page=0):
        return f'{self.url}&{urlencode({'pagination[page]': page})}'
