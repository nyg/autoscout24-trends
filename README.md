# AutoScout24 Trends

A car listing analytics platform that scrapes vehicle data from AutoScout24.ch, stores it in a PostgreSQL database, and provides a web 
interface to visualize trends and insights.

![AutoScout24 Trends frontpage](demo.png)

## Overview

This project consists of two main components:

1. **[Crawler](crawler/README.md)** — A Scrapy-based web scraper that extracts car listings from AutoScout24
2. **[Frontend](frontend/README.md)** — A Next.js web application that visualizes the collected data with charts and analytics

The system enables users to track car listings over time, analyze pricing trends, monitor availability, and compare historical data across different searches.

## Features

- **Automated Web Scraping**: Bypasses anti-bot protections using SeleniumBase CDP mode
- **Database Storage**: Persists car, seller, and search configuration data in PostgreSQL
- **Data Visualization**: Interactive charts and tables for analyzing trends
- **Search Management**: Configure and manage searches from the web UI

## Headless Linux tips

When running the crawler headless with Xvfb on a Linux server, you may want to record or inspect browser sessions for debugging. See the [Tips for headless Linux environments](https://github.com/nyg/scrapy-seleniumbase-cdp#tips-for-headless-linux-environments) section in the `scrapy-seleniumbase-cdp` README for instructions on:

- **Recording an Xvfb session** with `ffmpeg`
- **Connecting via VNC** to a live Xvfb session with `x11vnc`
