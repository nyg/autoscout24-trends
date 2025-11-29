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

# Output cars into a CSV file
FEED_EXPORTERS = {
    'csv': 'autoscout.exporters.CarWithSellerCsvItemExporter'
}

FEEDS = {
    'cars.csv': {
        'format': 'csv',
        'encoding': 'utf8',
        'overwrite': True,
        'store_empty': True,
    },
}

DOWNLOADER_MIDDLEWARES = {
    'autoscout.middlewares.SeleniumBaseAsyncCDPMiddleware': 800
}

EXTENSIONS = {
    'autoscout.extensions.EmailAfterFeedExport': 1,
}

ITEM_PIPELINES = {
    'autoscout.pipelines.ItemTypeStatsPipeline': 200,
    'autoscout.pipelines.PostgreSQLPipeline': 300,
}
