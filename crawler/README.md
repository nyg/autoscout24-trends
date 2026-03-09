# AutoScout24 Crawler

A Scrapy-based web crawler that extracts car listings from AutoScout24.ch, stores them in PostgreSQL, and sends email reports. The spider uses SeleniumBase CDP mode to bypass CloudFlare and other anti-bot protections.

## Introduction

This crawler is composed of one [Scrapy spider](https://docs.scrapy.org/en/latest/topics/spiders.html) called `search` that:

1. **Crawls** AutoScout24 search results and individual car listing pages
2. **Extracts** vehicle details (price, mileage, specs) and seller information
3. **Stores** data in PostgreSQL with batch tracking for historical analysis
4. **Generates** CSV export files with combined car and seller data
5. **Emails** results to configured recipients via Resend API

### Key Features

- **Anti-bot bypass**: Uses [SeleniumBase](https://seleniumbase.io/) CDP mode to avoid CloudFlare blocks
- **Concurrent support**: Configurable request concurrency and delays
- **Screenshot capture**: Saves listing page screenshots for visual records
- **Batch tracking**: Uses sequence-generated IDs to track scraping sessions
- **Flexible search config**: Define multiple searches with separate `.env` files

## Installation

### Prerequisites

- Python 3.9 or higher
- PostgreSQL 13 or higher
- Chromium browser
- Linux: `xvfb` for headless operation

### System Dependencies (Linux)

```bash
sudo apt install chromium xvfb
```

### Python Setup

Using a virtual environment is recommended to isolate dependencies:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Database Setup

1. Create a PostgreSQL database:

```bash
createdb autoscout24_trends
```

2. Initialize the schema:

```bash
psql -d autoscout24_trends -f SCHEMA.sql
```

3. The schema creates:
   - `cars` table: stores vehicle listings with detailed attributes
   - `sellers` table: stores seller/dealer information
   - `car_batch_id_seq`: sequence for tracking crawl batches

### Environment Configuration

Create a `.env` file in the crawler directory:

```env
PGSQL_URL=postgresql://username:password@localhost:5432/autoscout24_trends
RESEND_API_KEY=re_YourApiKeyFromResendCom
```

#### Required Variables

- `PGSQL_URL`: PostgreSQL connection string
- `RESEND_API_KEY`: API key from [resend.com](https://resend.com) (free tier available)

## Usage

### Creating Search Files

Search configuration files define what to scrape. Create `.env` files in the `searches/` directory:

**Example: `searches/audi_rs6.env`**

```env
name=Audi RS6 Avant
emails=your.email@example.com,colleague@example.com
url=https://www.autoscout24.ch/en/cars/audi/rs-6?sort=standard&desc=0
```

#### Search File Parameters

- `name`: Human-readable name for the search (used in filenames and database)
- `emails`: Comma-separated list of email recipients (optional, leave empty to skip emails)
- `url`: Full AutoScout24 search URL with filters

### Running the Spider

#### Manual Execution

Run a single search:

```bash
# Activate virtual environment
source venv/bin/activate

# Run the search spider
scrapy crawl search -a search_file=audi_rs6.env

# Deactivate when done
deactivate
```

#### Run All Searches

The `run-spiders.sh` script processes all `.env` files in `searches/`:

```bash
./run-spiders.sh
```

This script will:
- Create/activate a virtual environment
- Install dependencies
- Execute each search file sequentially
- Generate logs and output files

### Output Files

The crawler generates files in the `output/` directory:

- **CSV exports**: `search_<search_name>_<timestamp>.csv`
- **Screenshots**: `screenshot_<search_name>_<vehicle_id>_<timestamp>.png`

## Cron Jobs

Schedule automatic daily crawls:

```bash
# Create log directory
mkdir -p $HOME/.local/state/autoscout24-trends

# Edit crontab
crontab -e

# Add cron job (runs daily at midnight)
0 0 * * * /path/to/autoscout24-trends/crawler/run-spiders.sh >> $HOME/.local/state/autoscout24-trends/cron.log 2>&1

# Verify cron job
crontab -l
```

## Database Schema

### Tables

#### `cars`

Stores vehicle listings with the following key columns:

- `id`: Auto-incrementing primary key
- `search_name`: Name from search configuration
- `batch_id`: Tracks crawl session (from `car_batch_id_seq`)
- `vehicle_id`: AutoScout24 vehicle identifier
- `price`, `mileage`, `fuel_type`, `body_type`, `color`: Vehicle attributes
- `kilo_watts`, `cm3`, `cylinders`, `cylinder_layout`: Engine specs
- `avg_consumption`, `co2_emission`: Efficiency data
- `first_registration_date`, `last_inspection_date`: Date fields
- `seller_id`: Foreign key to sellers table
- `date_in`: Timestamp of when record was created
- `json_data`: Complete JSON response from AutoScout24

#### `sellers`

Stores dealer/seller information:

- `id`: Seller identifier from AutoScout24
- `name`, `address`, `city`, `zip_code`: Contact information
- `type`: Seller type (dealer, private, etc.)

### Development Setup

```bash
# Install development dependencies
pip install -r requirements.txt

# Run tests (if available)
pytest

# Format code
black autoscout/

# Lint code
flake8 autoscout/
```

## License

This project is provided as-is for educational and personal use. Please respect:

- AutoScout24's Terms of Service
- Rate limiting and robots.txt
- Data privacy regulations (GDPR, etc.)
- Ethical web scraping practices

**Disclaimer**: Use this crawler responsibly and at your own risk. The authors are not responsible for any misuse or violations of AutoScout24's terms.

## Additional Resources

- [Scrapy Documentation](https://docs.scrapy.org/)
- [SeleniumBase CDP Mode](https://seleniumbase.io/help_docs/cdp_mode/)
- [Resend Email API](https://resend.com/docs)
- [PostgreSQL psycopg3](https://www.psycopg.org/psycopg3/)

---

**[← Back to Project README](../README.md)**
