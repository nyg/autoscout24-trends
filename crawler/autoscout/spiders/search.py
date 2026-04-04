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

    def __init__(self, spider=None, **kwargs):
        if spider:
            meta = kwargs.pop('meta', {})
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
        start_url = self._build_search_page_url()
        self.logger.info(f'Starting crawl with URL: {start_url}')
        yield SearchPageRequest(self, url=start_url)

    def parse(self, response: Response, **kwargs):
        """Parse the search result page using flight data."""
        page_index, page_count, total_car_count, car_urls = self._extract_search_results(response)
        self.logger.info(f'Parsing search page: {page_index}/{page_count} {response.url}')

        self.cars_found = total_car_count

        for car_url in car_urls:
            self.logger.info(f'Car found: {car_url}')
            yield CarPageRequest(self, url=car_url)

        next_page = page_index + 1
        if next_page < page_count:
            self.logger.info(f'Next page: {next_page}')
            yield SearchPageRequest(self, url=self._build_search_page_url(next_page), page=next_page)

    def parse_car(self, response: Response):
        try:
            self.logger.info(f'Parsing car: {response.url} ({response.status})')
            car_data = self._extract_car_data(response.body)

            car = CarItem.parse_response(self.search_id, response.url, car_data)

            screenshot = response.meta.get('screenshot')
            car['screenshot'] = screenshot

            yield SellerItem.parse_response(car_data['seller'])
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
    def _extract_search_results(response):
        fd = njsparser.BeautifulFD(response.body)
        prefetched, _ = SearchSpider._find_nested_key(fd, 'prefetchedListings', lambda p: isinstance(p, dict) and 'totalPages' in p)
        listing_urls = [SearchSpider._build_car_url(listing) for listing in prefetched['content']]
        return prefetched['number'], prefetched['totalPages'], prefetched['totalElements'], listing_urls

    @staticmethod
    def _extract_car_data(body):
        """Extract Next.js flight data describing the vehicle and seller.

        Uses recursive key search instead of hardcoded path navigation to be
        resilient to DOM structure changes.
        """
        fd = njsparser.BeautifulFD(body)
        text = {hex(t.index).replace('0x', '$'): t.value for t in fd.find_iter([njsparser.T.Text])}

        pvt, parent = SearchSpider._find_nested_key(fd, 'pageViewTracking',
                                                    lambda pvt: pvt['englishVirtualPagePath'] == 'details')
        listing, _ = SearchSpider._find_nested_key(parent, 'listing')
        seller, _ = SearchSpider._find_nested_key(parent, 'seller')

        if not pvt or not listing or not seller:
            raise ValueError(
                f'Could not extract complete flight data: pvt={pvt is not None}, listing={listing is not None}, seller={seller is not None}')

        # sometimes, description is a reference (e.g. "$31") pointing to a separate Text node instead of being inlined
        if listing.get('description') in text:
            listing['description'] = text[listing['description']]

        return {
            'pageViewTracking': pvt,
            'listing': listing,
            'seller': seller,
        }

    @staticmethod
    def _find_nested_key(obj, key, condition=lambda candidate: True, _depth=0):
        """Recursively search for a key in nested dict/list structure.
        Accepts a BeautifulFD (searches all Data node contents) or a dict/list.
        Returns (value, parent_dict) if found, or (None, None)."""
        if isinstance(obj, njsparser.BeautifulFD):
            for data_node in obj.find_iter([njsparser.T.Data]):
                if data_node.content is None:
                    continue
                result, parent = SearchSpider._find_nested_key(data_node.content, key, condition)
                if result is not None:
                    return result, parent
            return None, None
        if _depth > 20:
            return None, None
        if isinstance(obj, dict):
            if key in obj:
                try:
                    if condition(obj[key]):
                        return obj[key], obj
                except Exception:
                    pass
            for v in obj.values():
                result, parent = SearchSpider._find_nested_key(v, key, condition, _depth + 1)
                if result is not None:
                    return result, parent
        elif isinstance(obj, list):
            for item in obj:
                result, parent = SearchSpider._find_nested_key(item, key, condition, _depth + 1)
                if result is not None:
                    return result, parent
        return None, None

    @staticmethod
    def _build_car_url(listing):
        return f'https://www.autoscout24.ch/en/d/{listing['id']}'

    def _build_search_page_url(self, page=0):
        return f'{self.url}&{urlencode({'pagination[page]': page})}'
