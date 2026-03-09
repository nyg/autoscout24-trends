# AutoScout24 Trends

A comprehensive car listing analytics platform that scrapes vehicle data from AutoScout24, stores it in a PostgreSQL database, and provides a modern web interface to visualize trends and insights.

## Overview

This project consists of two main components:

1. **Crawler** - A Scrapy-based web scraper that extracts car listings from AutoScout24
2. **Frontend** - A Next.js web application that visualizes the collected data with charts and analytics

The system enables users to track car listings over time, analyze pricing trends, monitor availability, and compare historical data across different searches.

## Architecture

```
autoscout24-trends/
├── crawler/          # Scrapy spider for data collection
│   ├── autoscout/    # Spider, pipelines, and settings
│   ├── searches/     # Search configuration files
│   └── output/       # Generated CSV files and screenshots
├── frontend/         # Next.js web application
│   └── src/          # Application source code
└── README.md         # This file
```

## Features

- **Automated Web Scraping**: Bypasses anti-bot protections using SeleniumBase CDP mode
- **Database Storage**: Persists car and seller data in PostgreSQL with full schema
- **Email Notifications**: Sends CSV reports via email after each crawl
- **Data Visualization**: Interactive charts and tables for analyzing trends
- **Batch Tracking**: Maintains historical data with batch IDs for time-series analysis
- **Responsive UI**: Modern, mobile-friendly interface built with Next.js and TailwindCSS

## Prerequisites

- **Python 3.9+** (for crawler)
- **Node.js 18+** (for frontend)
- **PostgreSQL 13+** (for database)
- **Chromium** (for web scraping)

### Linux-Specific Dependencies

```bash
sudo apt install chromium xvfb
```

## Quick Start

### 1. Database Setup

Create a PostgreSQL database and run the schema:

```bash
psql -U your_user -d your_database -f crawler/SCHEMA.sql
```

### 2. Configure Environment Variables

Both the crawler and frontend require a `PGSQL_URL` environment variable. See individual README files for details.

### 3. Run the Crawler

See [crawler/README.md](crawler/README.md) for detailed instructions on configuring and running the spider.

```bash
cd crawler
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
scrapy crawl search -a search_file=your_search.env
```

### 4. Start the Frontend

See [frontend/README.md](frontend/README.md) for setup and deployment instructions.

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to view the application.

## Project Components

### Crawler

The crawler is a Scrapy spider that:
- Accepts search configuration files defining AutoScout24 URLs
- Extracts car listings and seller information
- Stores data in PostgreSQL with batch tracking
- Generates CSV exports
- Sends email notifications with results

**[→ View Crawler Documentation](crawler/README.md)**

### Frontend

The frontend is a Next.js application that:
- Displays active car listings from the latest batch
- Shows historical trends with interactive charts
- Provides search-based filtering via dynamic routes
- Uses Server Components for optimized performance
- Connects directly to PostgreSQL for data retrieval

**[→ View Frontend Documentation](frontend/README.md)**

## Automation

You can schedule the crawler to run automatically using cron:

```bash
# Run daily at midnight
0 0 * * * /path/to/autoscout24-trends/crawler/run-spiders.sh >> /path/to/cron.log 2>&1
```

The `run-spiders.sh` script processes all search files in the `crawler/searches/` directory.

## Configuration

### Search Files

Search configuration files (`.env` format) should be placed in `crawler/searches/`:

```env
name=Audi RS6
emails=user@example.com,admin@example.com
url=https://www.autoscout24.ch/en/cars/audi/rs-6?...
```

### Environment Variables

Both components require:
- `PGSQL_URL`: PostgreSQL connection string

The crawler additionally requires:
- `RESEND_API_KEY`: API key from resend.com for email notifications

## Support

For issues, questions, or contributions, please refer to the individual component READMEs:
- [Crawler Documentation](crawler/README.md)
- [Frontend Documentation](frontend/README.md)

---
