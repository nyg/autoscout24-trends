# AutoScout24 Crawler

[Scrapy spider](https://docs.scrapy.org/en/latest/topics/spiders.html) that scrapes AutoScout24 car listings and stores them in PostgreSQL.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Headless Linux tips](#headless-linux-tips)
- [Migration](#migration)
- [Project Structure](#project-structure)

## Features

- Bypasses CloudFlare protection using [SeleniumBase CDP mode](https://github.com/nyg/scrapy-seleniumbase-cdp)
- Extracts vehicle details (price, mileage, specs) and seller information
- Stores data in PostgreSQL with batch tracking for historical analysis
- Search configurations stored in database, manageable from the frontend Settings page
- Sends a batch summary email after all spiders finish (requires [Resend](https://resend.com) API key)

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
BATCH_EMAIL_TO=you@example.com
```

## Usage

### Managing Searches

Searches are stored in the `searches` database table and managed from the frontend Settings page (`/settings`). Each search has:

- **name**: display label used in filenames and the UI
- **url**: AutoScout24 search URL with filters
- **is_active**: whether the search is included in batch runs

You can also insert searches directly via SQL:

```sql
INSERT INTO searches (name, url) VALUES ('Audi RS6 Avant', 'https://www.autoscout24.ch/en/cars/audi/rs-6?sort=standard&desc=0');
```

### Running

Run a single search by ID:

```bash
source .venv/bin/activate
scrapy crawl search -a search_id=1
```

Run all active searches (creates `.venv` if needed, updates dependencies, then starts all spiders):

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

## Headless Linux tips

When running the crawler headless with Xvfb on a Linux server, you may want to record or inspect browser sessions for debugging. See the [Tips for headless Linux environments](https://github.com/nyg/scrapy-seleniumbase-cdp#tips-for-headless-linux-environments) section in the `scrapy-seleniumbase-cdp` README for instructions on:

- **Recording an Xvfb session** with `ffmpeg`
- **Connecting via VNC** to a live Xvfb session with `x11vnc`

## Migration

If upgrading from the file-based search configuration (`.env` files in `searches/`), run the migration script:

```bash
psql -d autoscout24_trends -f migrations/001_add_searches_table.sql
```

This will:
1. Create the `searches` table
2. Populate it from existing `cars.search_name` values (with placeholder URLs — update them afterwards)
3. Replace `cars.search_name` with `cars.search_id` (FK to `searches`)

After migrating, update the `url` for each search in the Settings page or via SQL.

## Project Structure

```
crawler/
├── autoscout/           # Scrapy project package
│   ├── spiders/
│   │   └── search.py    # Main spider
│   ├── items.py         # Scrapy item definitions
│   ├── pipelines.py     # PostgreSQL pipeline
│   ├── email.py         # Batch summary email
│   ├── extensions.py    # Search run tracking extension
│   └── settings.py      # Scrapy settings
├── migrations/          # Database migration scripts
├── output/              # Screenshots (runtime output)
├── SCHEMA.sql           # PostgreSQL schema
├── run-spiders.sh       # Shell wrapper: updates deps, runs run-spiders.py
├── run-spiders.py       # Runs all spiders in-process via CrawlerRunner
└── requirements.txt     # Python dependencies
```
