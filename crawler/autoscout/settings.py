import logging
import re
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()
logging.getLogger('njsparser').setLevel(logging.ERROR)

BOT_NAME = 'autoscout'

SPIDER_MODULES = ['autoscout.spiders']
NEWSPIDER_MODULE = 'autoscout.spiders'

ADDONS = {}
ROBOTSTXT_OBEY = False
CONCURRENT_REQUESTS = 1
DOWNLOAD_DELAY = 5
RETRY_TIMES = 1
COOKIES_ENABLED = True
TELNETCONSOLE_ENABLED = False
LOG_LEVEL = 'INFO'
TWISTED_REACTOR = 'twisted.internet.asyncioreactor.AsyncioSelectorReactor'


def customize_params(params, spider):
    params['search_name'] = re.sub(r'\W+', '_', params['search_name']).lower().strip('_')
    params['time'] = datetime.now().strftime('%Y-%m-%dT%H-%M-%SZ')
    return params


FEED_URI_PARAMS = customize_params

FEED_EXPORTERS = {
    'csv': 'autoscout.exporters.CarWithSellerCsvItemExporter'
}

FEEDS = {
    'output/%(name)s_%(search_name)s_%(time)s.csv': {
        'format': 'csv',
        'encoding': 'utf8',
        'store_empty': True,
    },
}

screen_resolution = '1440,900'
SELENIUMBASE_BROWSER_OPTIONS = {
    'ad_block': True,
    'use_chromium': True,
    'xvfb_metrics': screen_resolution,
    'browser_args': [
        # '--disable-features=Translate',
        # This option doesn't work on Linux with Xvfb (https://issues.chromium.org/issues/429137221).
        # Create /etc/chromium/policies/managed/disable_translate.json with content: { "TranslateEnabled": false } instead.
        # '--start-maximized',
        # Doesn't work either on Linux with Xvfb. Using window-position and window-size instead.
        '--window-position=0,0',
        f'--window-size={screen_resolution}'],
}

DOWNLOADER_MIDDLEWARES = {
    'scrapy_seleniumbase_cdp.SeleniumBaseAsyncCDPMiddleware': 800
}

EXTENSIONS = {
    'scrapy.extensions.logstats.LogStats': None,
    'autoscout.extensions.EmailAfterFeedExport': 1,
    'autoscout.extensions.SearchRunExtension': 500,
}

ITEM_PIPELINES = {
    'autoscout.pipelines.ItemTypeStatsPipeline': 200,
    'autoscout.pipelines.PostgreSQLPipeline': 300,
}
