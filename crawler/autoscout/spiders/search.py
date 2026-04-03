import json
import os
import re
from datetime import datetime
from urllib.parse import urlencode

import njsparser
from scrapy import Spider
from scrapy.http import Response
from scrapy.spidermiddlewares.httperror import HttpError
from scrapy_seleniumbase_cdp import SeleniumBaseRequest
from twisted.python.failure import Failure

from ..items import CarItem, SellerItem

ACCEPT_COOKIES_AND_EXPAND_FIELDS = {
    'await_promise': True,
    'script': '''
        document.getElementById('onetrust-accept-btn-handler')?.click();
        [...document.querySelectorAll('button[aria-expanded="false"]')].slice(1).forEach(b => b.click())
        new Promise(resolve => setTimeout(resolve, 1000))
    '''
}


class SearchPageRequest(SeleniumBaseRequest):
    """Request for a search result page."""

    def __init__(self, spider=None, page=0, **kwargs):
        if spider:
            meta = kwargs.pop('meta', {})
            meta['page'] = page
            kwargs.update(callback=spider.parse, errback=spider.handle_error, meta=meta, wait_for_element='h1.chakra-text')
        super().__init__(**kwargs)


class CarPageRequest(SeleniumBaseRequest):
    """Request for a car page."""

    def __init__(self, spider=None, **kwargs):
        if spider:
            kwargs.update(callback=spider.parse_car,
                          errback=spider.handle_error,
                          wait_for_element='h1.chakra-text',
                          script=ACCEPT_COOKIES_AND_EXPAND_FIELDS,
                          screenshot=True)
        super().__init__(**kwargs)


class SearchSpider(Spider):
    name = 'search'
    allowed_domains = ['www.autoscout24.ch', 'autoscout24.ch']

    def __init__(self, search_id, search_name, url, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.search_id = int(search_id)
        self.search_name = search_name
        self.url = url
        self.failed_requests = []
        self.cars_found = None

    async def start(self):
        start_url = self._build_url()
        self.logger.info(f'Starting crawl with URL: {start_url}')
        yield SearchPageRequest(self, url=start_url)

    def parse(self, response: Response, **kwargs):
        """Parse the search result page"""
        self.logger.info(f'Parsing search page: {response.meta.get('page')} ({response.url}, {response.status})')

        fd = njsparser.BeautifulFD(response.text)
        if self.cars_found is None:
            self.cars_found = self._extract_listing_count(fd)

        # for each car url, call parse_car
        for car_url in response.xpath('//a[contains(@data-testid, "listing-card-")]/@href').getall():
            self.logger.info(f'Car found: {car_url}')
            yield CarPageRequest(self, url=response.urljoin(car_url))

        # fetch next page, if any
        go_to_page_links = response.xpath('//button[contains(@aria-label, "go to page")]/text()').getall()
        page_count = int(go_to_page_links[-1]) if go_to_page_links else 1
        next_page = response.meta.get('page') + 1

        if next_page < page_count:
            self.logger.info(f'Next page: {next_page}')
            yield SearchPageRequest(self, url=self._build_url(next_page), page=next_page)

    def parse_car(self, response: Response):
        try:
            self.logger.info(f'Parsing car: {response.url} ({response.status})')
            flight_data = self._extract_flight_data(response.body)

            car = CarItem.parse_response(self.search_id, response.url, flight_data)

            screenshot = response.meta.get('screenshot')
            car['screenshot'] = screenshot
            self._save_screenshot(car['vehicle_id'], screenshot)

            yield SellerItem.parse_response(flight_data['seller'])
            yield car
        except Exception as e:
            self.logger.error(f'Error parsing car: {e}')

    def handle_error(self, failure: Failure):
        """Handle request errors by logging the failed URL and reason, and storing it for summary on spider close."""
        reason = failure.value.response.status if failure.check(HttpError) else repr(failure.value)
        self.failed_requests.append({'url': failure.request.url, 'reason': reason})

    def closed(self, reason):
        """Log a summary of failed URLs when the spider finishes, if there are any."""
        if not self.failed_requests:
            return

        self.logger.warning(f'{len(self.failed_requests)} requests have failed:')
        for entry in self.failed_requests:
            self.logger.warning(f"  Scraping {entry['url']} failed due to: {entry['reason']}")

    @staticmethod
    def _extract_listing_count(fd):
        """Extract total listing count from search page flight data."""
        for data_node in fd.find_all([njsparser.T.Data]):
            pvt = SearchSpider._find_nested_key(data_node.content, 'pageViewTracking')
            if isinstance(pvt, dict) and isinstance(pvt.get('search_listingCount'), int):
                return pvt['search_listingCount']
        return None

    @staticmethod
    def _find_nested_key(obj, key, depth=0):
        """Recursively search for a key in nested dict/list structure."""
        if depth > 20:
            return None
        if isinstance(obj, dict):
            if key in obj:
                return obj[key]
            for v in obj.values():
                result = SearchSpider._find_nested_key(v, key, depth + 1)
                if result is not None:
                    return result
        elif isinstance(obj, list):
            for item in obj:
                result = SearchSpider._find_nested_key(item, key, depth + 1)
                if result is not None:
                    return result
        return None

    @staticmethod
    def _extract_flight_data(body):
        """Extract Next.js flight data describing the vehicle and seller"""
        fd = njsparser.BeautifulFD(body)
        data = next(x for x in fd.find_all([njsparser.T.Data]) if x.index == 7)
        nested_data = data.content['children'][3]['children'][3]['children'][3]['children'][3]
        text = {hex(t.index).replace('0x', '$'): t.value for t in fd.find_all([njsparser.T.Text])}

        # sometimes, description is a reference (e.g. "$31") pointing to a separate Text node instead of being inlined
        listing = nested_data['children'][1][0][3]['listing']
        if listing['description'] in text:
            listing['description'] = text[listing['description']]

        return {
            'pageViewTracking': nested_data['pageViewTracking'],
            'listing': listing,
            'seller': nested_data['children'][1][0][3]['seller'],
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
