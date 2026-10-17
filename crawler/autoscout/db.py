import os
import time

import psycopg
from scrapy.crawler import Crawler

# The connection can drop during a long stretch without queries (a captcha block on 2026-06-03 left it idle for 14 minutes),
# and psycopg only notices on the next query. Normal runs touch the database every few seconds, so this rarely costs a ping.
IDLE_CHECK_SECONDS = 60


def open_shared_connection(crawler: Crawler) -> psycopg.Connection:
    """Open the DB connection shared by SearchRunExtension and the pipelines, and attach it to the crawler."""
    crawler.db_connection = psycopg.connect(os.environ['PGSQL_URL'], connect_timeout=crawler.settings.getint('PGSQL_CONNECT_TIMEOUT'))
    crawler.db_connection_used_at = time.monotonic()
    return crawler.db_connection


def get_shared_connection(crawler: Crawler) -> psycopg.Connection:
    """Return the shared DB connection, reopening it if it was lost."""
    connection = getattr(crawler, 'db_connection', None)
    if connection is None:
        raise RuntimeError(
            'Shared DB connection not available. '
            'Ensure SearchRunExtension is enabled and has run spider_opened.')

    if connection.closed or (_idle_seconds(crawler) > IDLE_CHECK_SECONDS and not _is_alive(connection)):
        crawler.spider.logger.warning('Shared database connection lost, reconnecting')
        connection.close()
        return open_shared_connection(crawler)

    crawler.db_connection_used_at = time.monotonic()
    return connection


def close_shared_connection(crawler: Crawler) -> None:
    if connection := getattr(crawler, 'db_connection', None):
        connection.close()
        crawler.db_connection = None


def _idle_seconds(crawler: Crawler) -> float:
    return time.monotonic() - crawler.db_connection_used_at


def _is_alive(connection: psycopg.Connection) -> bool:
    try:
        with connection.transaction():
            connection.execute('SELECT 1')
        return True
    except psycopg.OperationalError:
        return False
