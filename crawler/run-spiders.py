#!/usr/bin/env python3
"""Run all autoscout24-trends spiders programmatically.

Reads active searches from the PostgreSQL database and launches one spider
per search.  Uses Scrapy's CrawlerRunner API to keep them strictly sequential.
No subprocess is involved; the Twisted reactor is shared across all runs.

Usage (from within the activated virtual environment):
    python run-spiders.py
"""

import logging
import os
import warnings
from pathlib import Path

# Suppress the Pydantic V1 compatibility warning emitted by itemadapter on
# Python 3.14+.  It fires at import time, before we can configure Scrapy
# logging, so a warnings filter is the only reliable way to silence it.
warnings.filterwarnings('ignore', message=r".*Pydantic V1.*")

import psycopg
from dotenv import load_dotenv

load_dotenv()

# The SeleniumBase CDP middleware requires the asyncio reactor.  Scrapy's
# install_reactor() must run before any import of twisted.internet.reactor
# so the correct reactor singleton is in place when Scrapy validates it.
from scrapy.utils.reactor import install_reactor
install_reactor('twisted.internet.asyncioreactor.AsyncioSelectorReactor')

from scrapy.crawler import CrawlerRunner  # noqa: E402
from scrapy.utils.log import configure_logging  # noqa: E402
from scrapy.utils.project import get_project_settings  # noqa: E402
from twisted.internet import defer, reactor  # noqa: E402

from autoscout.spiders.search import SearchSpider  # noqa: E402

SCRIPT_DIR = Path(__file__).parent.resolve()
OUTPUT_DIR = SCRIPT_DIR / 'output'

log = logging.getLogger(__name__)


def main():
    # Anchor the working directory so relative paths used by the feed settings
    # (output/<name>.csv) resolve correctly, regardless of where this script
    # is invoked from.
    os.chdir(SCRIPT_DIR)
    OUTPUT_DIR.mkdir(exist_ok=True)

    settings = get_project_settings()

    # CrawlerRunner does not configure logging on its own (unlike
    # CrawlerProcess), so we do it explicitly to see spider output.
    configure_logging(settings)

    with psycopg.connect(os.environ['PGSQL_URL'], connect_timeout=5) as conn:
        with conn.cursor() as cur:
            searches = cur.execute(
                'SELECT id, name FROM searches WHERE is_active = true ORDER BY name'
            ).fetchall()

    if not searches:
        log.warning('No active searches found in database')
        return

    # CrawlerRunner, unlike CrawlerProcess, does not own the reactor lifecycle.
    # We start it manually below and stop it once all crawlers have finished.
    runner = CrawlerRunner(settings)

    @defer.inlineCallbacks
    def crawl_all():
        try:
            for search_id, search_name in searches:
                log.info('Running spider for search: %s (id=%d)', search_name, search_id)
                yield runner.crawl(SearchSpider, search_id=search_id)
        except Exception:
            log.exception('Spider run failed')
        finally:
            reactor.stop()

    d = crawl_all()  # noqa: F841 – hold a reference so Twisted won't GC the deferred
    reactor.run()


if __name__ == '__main__':
    main()
