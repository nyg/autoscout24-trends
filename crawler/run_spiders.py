#!/usr/bin/env python3
"""Run all autoscout24-trends spiders.

Replaces run-spiders.sh with a cross-platform Python equivalent that:
- Creates/reuses a .venv virtual environment
- Installs requirements via pip
- Runs `scrapy crawl search` for every .env file found in searches/
"""

import logging
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


class _UtcFormatter(logging.Formatter):
    """Emit log timestamps in UTC ISO-8601 format, matching the shell script."""

    def formatTime(self, record, datefmt=None):
        ct = datetime.fromtimestamp(record.created, tz=timezone.utc)
        return ct.strftime('%Y-%m-%dT%H:%M:%S+00:00')


logging.basicConfig(level=logging.INFO)
logging.root.handlers[0].setFormatter(
    _UtcFormatter('[%(asctime)s] %(message)s')
)
log = logging.getLogger(__name__)

SCRIPT_DIR = Path(__file__).parent.resolve()
VENV_DIR = SCRIPT_DIR / '.venv'
SEARCHES_DIR = SCRIPT_DIR / 'searches'
OUTPUT_DIR = SCRIPT_DIR / 'output'

# Platform-aware paths inside the virtual environment.
if sys.platform == 'win32':
    _BIN = VENV_DIR / 'Scripts'
    PIP = _BIN / 'pip.exe'
    SCRAPY = _BIN / 'scrapy.exe'
else:
    _BIN = VENV_DIR / 'bin'
    PIP = _BIN / 'pip'
    SCRAPY = _BIN / 'scrapy'


def _run(cmd, **kwargs):
    """Run *cmd* via subprocess and raise on non-zero exit."""
    subprocess.run(cmd, check=True, **kwargs)


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)

    if not VENV_DIR.exists():
        log.info('Creating virtual environment')
        _run([sys.executable, '-m', 'venv', str(VENV_DIR)])

    log.info('Installing requirements')
    _run([str(PIP), 'install', '-r', str(SCRIPT_DIR / 'requirements.txt')])

    log.info('Running all autoscout24-trends spiders')
    env_files = sorted(SEARCHES_DIR.glob('*.env'))

    if not env_files:
        log.warning('No .env files found in %s', SEARCHES_DIR)
        return

    for env_file in env_files:
        log.info('Found search file: %s', env_file.name)
        _run(
            [str(SCRAPY), 'crawl', 'search', '-a', f'search_file={env_file.name}'],
            cwd=str(SCRIPT_DIR),
        )

    log.info('Finished running all spiders')


if __name__ == '__main__':
    main()
