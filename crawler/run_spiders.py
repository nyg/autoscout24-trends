#!/usr/bin/env python3
"""Run all autoscout24-trends spiders programmatically.

Uses Scrapy's CrawlerRunner API to launch each spider in-process,
with a Twisted deferred chain that keeps them strictly sequential.
No subprocess is involved; the Twisted reactor is shared across all runs.

Usage (from within the activated virtual environment):
    python run_spiders.py
"""

import logging
import os
from pathlib import Path

from scrapy.crawler import CrawlerRunner
from scrapy.utils.project import get_project_settings
from twisted.internet import defer, reactor

from autoscout.spiders.search import SearchSpider

SCRIPT_DIR = Path(__file__).parent.resolve()
SEARCHES_DIR = SCRIPT_DIR / 'searches'
OUTPUT_DIR = SCRIPT_DIR / 'output'

log = logging.getLogger(__name__)


def main():
    # Anchor the working directory so all relative paths used by the spider
    # (searches/<file>) and the feed settings (output/<name>.csv) resolve
    # correctly, regardless of where this script is invoked from.
    os.chdir(SCRIPT_DIR)
    OUTPUT_DIR.mkdir(exist_ok=True)

    env_files = sorted(SEARCHES_DIR.glob('*.env'))
    if not env_files:
        log.warning('No .env files found in %s', SEARCHES_DIR)
        return

    # CrawlerRunner, unlike CrawlerProcess, does not own the reactor lifecycle.
    # We start it manually below and stop it once all crawlers have finished.
    runner = CrawlerRunner(get_project_settings())

    @defer.inlineCallbacks
    def crawl_all():
        try:
            for env_file in env_files:
                log.info('Running spider for search file: %s', env_file.name)
                yield runner.crawl(SearchSpider, search_file=env_file.name)
        except Exception:
            log.exception('Spider run failed')
        finally:
            reactor.stop()

    crawl_all()
    reactor.run()


if __name__ == '__main__':
    main()
