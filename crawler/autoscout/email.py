"""Batch summary email sent after all spiders finish."""

import logging
import os
from datetime import datetime
from textwrap import dedent
from typing import Any

import psycopg
import resend
from jinja2 import Template

log = logging.getLogger(__name__)

template = Template(lstrip_blocks=True, trim_blocks=True, source=dedent('''
    Batch run completed: {{ runs | length }} search(es) executed.

    {% for run in runs %}
    {{ '✓' if run.success else '✗' }} {{ run.search_name }}
      Cars: {{ run.cars_scraped }}/{{ run.cars_found }} scraped
      Requests: {{ run.request_count }} ({{ run.failed_request_count }} failed)
      Finish reason: {{ run.finish_reason }}
      Duration: {{ run.duration }}
    {% endfor %}

    --- Summary ---
    Successful:  {{ successful }}/{{ runs | length }}
    Total cars:  {{ total_cars_scraped }}/{{ total_cars_found }} scraped
    Total time:  {{ total_duration }}
''').strip())


def _format_duration(start: datetime | None, end: datetime | None) -> str:
    if not start or not end:
        return 'N/A'
    delta = end - start
    minutes, seconds = divmod(int(delta.total_seconds()), 60)
    return f'{minutes}m {seconds}s' if minutes else f'{seconds}s'


def send_batch_summary_email(batch_started_at: datetime, search_ids: list[int]) -> None:
    """Send a summary email for search runs started after batch_started_at.

    Silently skips if RESEND_API_KEY is not set or no email recipient is
    configured in the database config table.
    """
    if not (api_key := os.environ.get('RESEND_API_KEY', '')):
        log.info('Batch email skipped (RESEND_API_KEY not set)')
        return

    try:
        with psycopg.connect(os.environ['PGSQL_URL'], connect_timeout=1) as conn:
            with conn.cursor() as cur:
                row = cur.execute(
                    "SELECT value FROM config WHERE key = 'email-recipient'"
                ).fetchone()
                email_to = (row[0] or '').strip() if row else ''

                if not email_to:
                    log.info('Batch email skipped (no email-recipient in config table)')
                    return

                rows = cur.execute('''
                    SELECT s.name, sr.success, sr.cars_found, sr.cars_scraped,
                           sr.request_count, sr.failed_request_count,
                           sr.finish_reason, sr.started_at, sr.finished_at
                      FROM search_runs sr
                      JOIN searches s ON sr.search_id = s.id
                     WHERE sr.search_id = ANY(%s)
                       AND sr.started_at >= %s
                     ORDER BY sr.started_at
                ''', (search_ids, batch_started_at)).fetchall()

        if not rows:
            log.warning('No search runs found for batch email')
            return

        runs: list[dict[str, Any]] = [
            {
                'search_name': name,
                'success': success,
                'cars_found': found or 0,
                'cars_scraped': scraped or 0,
                'request_count': req or 0,
                'failed_request_count': failed_req or 0,
                'finish_reason': reason or 'unknown',
                'duration': _format_duration(started, finished),
            }
            for name, success, found, scraped, req, failed_req, reason, started, finished in rows
        ]

        successful = sum(1 for r in runs if r['success'])
        total_found = sum(r['cars_found'] for r in runs)
        total_scraped = sum(r['cars_scraped'] for r in runs)

        first_start = rows[0][7]
        last_finish = rows[-1][8]

        body = template.render(
            runs=runs,
            successful=successful,
            total_cars_found=total_found,
            total_cars_scraped=total_scraped,
            total_duration=_format_duration(first_start, last_finish),
        )

        all_ok = successful == len(runs)
        subject = (
            f'AutoScout24 batch: {total_scraped} cars from {len(runs)} searches'
            if all_ok
            else f'AutoScout24 batch: {successful}/{len(runs)} searches OK, {total_scraped} cars'
        )

        resend.api_key = api_key
        resend.Emails.send({
            'from': 'AutoScout24 Crawler <autoscout24-crawler@resend.dev>',
            'to': [addr.strip() for addr in email_to.split(',')],
            'subject': subject,
            'text': body,
        })
        log.info('Batch summary email sent to %s', email_to)

    except Exception:
        log.exception('Failed to send batch summary email')
