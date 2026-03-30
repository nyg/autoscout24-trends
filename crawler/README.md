# AutoScout24 Crawler

[Scrapy spider](https://docs.scrapy.org/en/latest/topics/spiders.html) that scrapes AutoScout24 car listings and stores them in PostgreSQL.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)

## Features

- Bypasses CloudFlare protection using [SeleniumBase CDP mode](https://github.com/nyg/scrapy-seleniumbase-cdp)
- Extracts vehicle details (price, mileage, specs) and seller information
- Stores data in PostgreSQL with batch tracking for historical analysis
- Generates CSV exports
- Sends email reports via Resend API

## Installation

Install system dependencies:

```bash
sudo apt install chromium xvfb
```

Set up a Python virtual environment and install packages:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

Create a PostgreSQL database and initialize the schema:

```bash
createdb autoscout24_trends
psql -d autoscout24_trends -f SCHEMA.sql
```

Create a `.env` file in the crawler directory:

```env
PGSQL_URL=postgresql://username:password@localhost:5432/autoscout24_trends
RESEND_API_KEY=re_YourApiKeyFromResendCom
```

## Usage

### Search Files

Create `.env` files in `searches/` to define what to scrape:

```env
name=Audi RS6 Avant
emails=user@example.com
url=https://www.autoscout24.ch/en/cars/audi/rs-6?sort=standard&desc=0
```

- `name`: search label used in filenames and database
- `emails`: comma-separated recipients (optional)
- `url`: AutoScout24 search URL with filters

### Running

Run a single search:

```bash
source .venv/bin/activate
scrapy crawl search -a search_file=audi_rs6.env
```

Run all searches (creates `.venv` if needed, updates dependencies, then starts all spiders):

```bash
./run-spiders.sh
```

### Cron Job

Schedule daily crawls:

```bash
mkdir -p $HOME/.local/state/autoscout24-trends
crontab -e
```

```cron
0 0 * * * /path/to/crawler/run-spiders.sh >> $HOME/.local/state/autoscout24-trends/cron.log 2>&1
```

## Project Structure

```
crawler/
├── autoscout/           # Scrapy project package
│   ├── spiders/
│   │   └── search.py    # Main spider
│   ├── items.py         # Scrapy item definitions
│   ├── pipelines.py     # PostgreSQL pipeline
│   ├── exporters.py     # CSV exporter
│   ├── extensions.py    # Email extension
│   └── settings.py      # Scrapy settings
├── searches/            # Search configuration files (.env)
├── output/              # Generated CSV exports and screenshots
├── SCHEMA.sql           # PostgreSQL schema
├── run-spiders.sh       # Shell wrapper: updates deps, runs run-spiders.py
├── run-spiders.py       # Runs all spiders in-process via CrawlerRunner
└── requirements.txt     # Python dependencies
```
