import re
from datetime import datetime
from os import path
from urllib.parse import urlencode

import njsparser
from dotenv import dotenv_values
from scrapy import Spider
from scrapy_seleniumbase_cdp import SeleniumBaseRequest

from ..items import CarItem, SellerItem

ACCEPT_COOKIES_AND_EXPAND_FIELDS = {
    'await_promise': True,
    'script': '''
        document.getElementById('onetrust-accept-btn-handler').click();
        [...document.querySelectorAll('button[aria-expanded="false"]')].slice(1).forEach(b => b.click())
        new Promise(resolve => setTimeout(resolve, 1000))
    '''
}


class SearchPageRequest(SeleniumBaseRequest):
    """Request for a search result page."""

    def __init__(self, page=0, **kwargs):
        super().__init__(**kwargs, meta={'page': page}, wait_for='h1.chakra-text')


class CarPageRequest(SeleniumBaseRequest):
    """Request for a car page."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs, wait_for='h1.chakra-text', script=ACCEPT_COOKIES_AND_EXPAND_FIELDS, screenshot=True)


class SearchSpider(Spider):
    name = 'search'
    allowed_domains = ['www.autoscout24.ch', 'autoscout24.ch']

    def __init__(self, search_file, *args, **kwargs):
        super().__init__(*args, **kwargs)

        filepath = path.join('searches', search_file)
        if not path.exists(filepath):
            raise FileNotFoundError(f'Search file {filepath} could not be found')

        search_config = dotenv_values(filepath)
        if any(k not in search_config for k in ('name', 'emails', 'url')):
            raise ValueError('Missing keys in search file, check example')

        self.search_name = search_config['name']
        self.emails = [e.strip() for e in search_config['emails'].split(',')] if search_config['emails'] else None
        self.url = search_config['url']

    async def start(self):
        yield SearchPageRequest(url=self._build_url(), callback=self.parse)

    def parse(self, response, **kwargs):
        """Parse the search result page"""
        self.logger.info(f'Parsing page: {response.meta.get('page')}')

        # for each car url, call parse_car
        for car_url in response.xpath('//a[contains(@data-testid, "listing-card-")]/@href').getall():
            self.logger.info(f'Car found: {car_url}')
            yield CarPageRequest(url=response.urljoin(car_url), callback=self.parse_car)

        # fetch next page, if any
        go_to_page_links = response.xpath('//button[contains(@aria-label, "go to page")]/text()').getall()
        page_count = int(go_to_page_links[-1]) if go_to_page_links else 1
        next_page = response.meta.get('page') + 1

        if next_page < page_count:
            self.logger.info(f'Next page: {next_page}')
            yield SearchPageRequest(url=self._build_url(next_page), callback=self.parse, page=next_page)

    def parse_car(self, response):
        try:
            self.logger.info(f'Parsing car: {response}')
            flight_data = self._extract_flight_data(response.body)

            car = CarItem.parse_response(self.search_name, response.url, flight_data)
            self._save_screenshot(car['vehicle_id'], response.meta.get('screenshot'))

            yield SellerItem.parse_response(flight_data['seller'])
            yield car
        except Exception as e:
            self.logger.error(f'Error parsing car: {e}')

    @staticmethod
    def _extract_flight_data(body):
        """Extract Next.js flight data describing the vehicle and seller"""
        data = njsparser.BeautifulFD(body).find_iter([njsparser.T.Data])
        matches = [d.content['children'][3]['children'][3]['children'][3] for d in data
                   if {'children', 'referer'}.issubset(d.content)]
        return {
            'pageViewTracking': matches[0]['pageViewTracking'],
            'listing': matches[0]['children'][1][0][3]['listing'],
            'seller': matches[0]['children'][1][0][3]['seller']
        }

    def _save_screenshot(self, vehicle_id, data):
        if not data:
            self.logger.warning('No screenshot data to be saved')
            return

        now = datetime.now().strftime('%Y-%m-%dT%H-%M-%SZ')
        search_name = re.sub(r'\W+', '_', self.search_name).lower().strip('_')
        filename = f'output/screenshot_{search_name}_{vehicle_id}_{now}.png'

        with open(filename, 'wb') as screenshot_file:
            screenshot_file.write(data)

    def _build_url(self, page=0):
        return f'{self.url}&{urlencode({'pagination[page]': page})}'
