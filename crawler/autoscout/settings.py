import re
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

BOT_NAME = 'autoscout'

SPIDER_MODULES = ['autoscout.spiders']
NEWSPIDER_MODULE = 'autoscout.spiders'

ADDONS = {}

ROBOTSTXT_OBEY = False

CONCURRENT_REQUESTS = 1
DOWNLOAD_DELAY = 3

COOKIES_ENABLED = False
TELNETCONSOLE_ENABLED = False

LOG_LEVEL = 'INFO'


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

DOWNLOADER_MIDDLEWARES = {
    'scrapy_seleniumbase_cdp.SeleniumBaseAsyncCDPMiddleware': 800
}

EXTENSIONS = {
    'autoscout.extensions.EmailAfterFeedExport': 1,
}

ITEM_PIPELINES = {
    'autoscout.pipelines.ItemTypeStatsPipeline': 200,
    'autoscout.pipelines.PostgreSQLPipeline': 300,
}
