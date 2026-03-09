# AutoScout24 Trends

A car listing analytics platform that scrapes vehicle data from AutoScout24.ch, stores it in a PostgreSQL database, and provides a web 
interface to visualize trends and insights.

## Overview

This project consists of two main components:

1. **[Crawler](crawler/)** — A Scrapy-based web scraper that extracts car listings from AutoScout24
2. **[Frontend](frontend/)** — A Next.js web application that visualizes the collected data with charts and analytics

The system enables users to track car listings over time, analyze pricing trends, monitor availability, and compare historical data across different searches.


## Features

- **Automated Web Scraping**: Bypasses anti-bot protections using SeleniumBase CDP mode
- **Database Storage**: Persists car and seller data in PostgreSQL with full schema
- **Email Notifications**: Sends CSV reports via email after each crawl
- **Data Visualization**: Interactive charts and tables for analyzing trends

## Quick Start

### Run the Crawler

See [crawler/README.md](crawler/README.md) for detailed setup and usage instructions.

### Start the Frontend

See [frontend/README.md](frontend/README.md) for detailed setup and usage instructions.
