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
source venv/bin/activate  # Linux/macOS
# or
.\venv\Scripts\activate  # Windows

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

#### Scrapy Commands

```bash
# List all spiders
scrapy list

# Run with custom log level
scrapy crawl search -a search_file=audi_rs6.env --loglevel=DEBUG

# Run without output files (database only)
scrapy crawl search -a search_file=audi_rs6.env -s FEEDS={}
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

## Configuration

### Spider Settings

Edit `autoscout/settings.py` to customize behavior:

```python
# Concurrency settings
CONCURRENT_REQUESTS = 1        # Number of simultaneous requests
DOWNLOAD_DELAY = 3             # Delay between requests (seconds)

# Logging
LOG_LEVEL = 'INFO'             # DEBUG, INFO, WARNING, ERROR

# Feed exports
FEEDS = {
    'output/%(name)s_%(search_name)s_%(time)s.csv': {
        'format': 'csv',
        'encoding': 'utf8',
    }
}
```

### Pipeline Configuration

The crawler uses these pipelines (in order):

1. **ItemTypeStatsPipeline** (priority 200): Counts scraped items by type
2. **PostgreSQLPipeline** (priority 300): Stores data in PostgreSQL

### Extensions

- **EmailAfterFeedExport**: Sends CSV files via email after crawl completion

## Automation

### Setting Up Cron Jobs

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

### Alternative: systemd Timer (Linux)

Create `~/.config/systemd/user/autoscout24-crawler.service`:

```ini
[Unit]
Description=AutoScout24 Crawler

[Service]
Type=oneshot
WorkingDirectory=/path/to/autoscout24-trends/crawler
ExecStart=/path/to/autoscout24-trends/crawler/run-spiders.sh
```

Create `~/.config/systemd/user/autoscout24-crawler.timer`:

```ini
[Unit]
Description=Run AutoScout24 Crawler Daily

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

Enable the timer:

```bash
systemctl --user enable --now autoscout24-crawler.timer
systemctl --user status autoscout24-crawler.timer
```

## Database Schema

### Tables

#### `cars`

Stores vehicle listings with the following key columns:

- `id`: Auto-incrementing primary key
- `search_name`: Name from search configuration
- `batch_id`: Tracks crawl session (from `car_batch_id_seq`)
- `vehicle_id`: AutoScout24 vehicle identifier
- `price`, `mileage`, `fuel_type`, `body_type`: Vehicle attributes
- `first_registration_date`, `last_inspection_date`: Date fields
- `seller_id`: Foreign key to sellers table
- `date_in`: Timestamp of when record was created
- `json_data`: Complete JSON response from AutoScout24

#### `sellers`

Stores dealer/seller information:

- `id`: Seller identifier from AutoScout24
- `name`, `address`, `city`, `zip_code`: Contact information
- `type`: Seller type (dealer, private, etc.)

### Batch Tracking

Each crawl session gets a unique `batch_id` from the sequence. This enables:
- Tracking which listings appeared in which crawl
- Comparing listings over time
- Identifying new, removed, or changed listings

See [SCHEMA.sql](SCHEMA.sql) for complete DDL.

## Spider Details

### Search Spider

The `search` spider (in `autoscout/spiders/search.py`) implements:

#### Request Types

- **SearchPageRequest**: Fetches search result pages with pagination
- **CarPageRequest**: Fetches individual car listing pages with screenshots

#### Parsing Logic

1. **parse()**: Extracts car URLs from search results and handles pagination
2. **parse_car()**: Extracts vehicle details using Next.js flight data
3. **_extract_flight_data()**: Parses embedded JSON from Next.js pages

#### Data Extraction

The spider uses `njsparser` to extract structured data from Next.js flight data, which includes:
- Vehicle specifications and attributes
- Seller information
- Page view tracking metadata

### Allowed Domains

- `www.autoscout24.ch`
- `autoscout24.ch`

## Troubleshooting

### Common Issues

#### CloudFlare Blocks

**Symptom**: Spider gets blocked or returns error pages

**Solution**:
- Verify SeleniumBase CDP middleware is enabled
- Increase `DOWNLOAD_DELAY` in settings
- Check if AutoScout24 has updated their protections
- Try running during off-peak hours

#### Database Connection Errors

**Symptom**: `psycopg` connection failures

**Solution**:
- Verify `PGSQL_URL` format: `postgresql://user:password@host:port/dbname`
- Check database is running: `pg_isready`
- Ensure user has necessary permissions
- Test connection: `psql "$PGSQL_URL"`

#### Email Not Sending

**Symptom**: No emails received after crawl

**Solution**:
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for delivery status
- Ensure sender email is verified in Resend
- Check if `emails` field is set in search file

#### Missing Screenshots

**Symptom**: No screenshot files generated

**Solution**:
- Ensure `output/` directory exists
- Check disk space availability
- Verify Chromium is installed and accessible
- Review logs for screenshot-related errors

#### Parsing Errors

**Symptom**: Missing data or empty fields

**Solution**:
- AutoScout24 may have changed their HTML structure
- Check `parse_car()` method in spider
- Enable DEBUG logging to see raw responses
- Update XPath selectors or flight data extraction logic

### Debugging

Enable verbose logging:

```bash
scrapy crawl search -a search_file=test.env --loglevel=DEBUG
```

Use Scrapy shell for interactive debugging:

```bash
scrapy shell "https://www.autoscout24.ch/en/..."
```

## Contributing

Contributions are welcome! Areas for improvement:

- Support for additional AutoScout24 regions (Germany, Austria, etc.)
- Enhanced error handling and retry logic
- Additional export formats (JSON, Excel)
- Price change detection and alerts
- Multi-language support

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
