from urllib.parse import urlencode

import scrapy

from autoscout.items import CarItem
from autoscout.loaders import CarLoader


class SearchSpider(scrapy.Spider):
    name = 'search'
    allowed_domains = ['autoscout24.ch']

    def __init__(self,
                 lang, make, model, fuel,
                 no_accidents=True, mileage_to=None, price_to=None, cylinders_to=None, registration_from=None,
                 *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.base_url = f'https://www.autoscout24.ch/{lang}/s/mo-{model}/mk-{make}/ft-{fuel}'
        self.search_params = {
            'hadNoAccidentOnly': no_accidents,
            'mileageTo': mileage_to,
            'priceTo': price_to,
            'cylindersTo': cylinders_to,
            'firstRegistrationYearFrom': registration_from,
        }

    async def start(self):
        yield scrapy.Request(url=self.url(), callback=self.parse, meta={'impersonate': 'chrome', 'page': 0})

    def parse(self, response, **kwargs):
        # for each car url, call parse_car
        for car_url in response.xpath('//a[contains(@data-testid, "listing-card-")]/@href'):
            self.logger.info(car_url.get())
            yield scrapy.Request(url=response.urljoin(car_url.get()), callback=self.parse_car, meta={'impersonate': 'chrome'})

        # fetch next page, if any
        page_count = len(response.xpath('//button[contains(@aria-label, "go to page")]'))
        next_page = response.meta.get('page') + 1

        if next_page < page_count:
            self.logger.info(f'Next page: {next_page}')
            yield scrapy.Request(url=self.url(next_page), callback=self.parse, meta={'impersonate': 'chrome', 'page': next_page})

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

    def url(self, page=0):
        self.search_params['pagination[page]'] = page
        query_string = urlencode(self.search_params)
        return f'{self.base_url}?{query_string}'
