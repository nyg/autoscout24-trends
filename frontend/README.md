# AutoScout24 Trends — Frontend

Next.js application that visualizes car listing data scraped by the crawler.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)

## Features

- Built with Next.js 16, Tailwind CSS 4, DaisyUI 5, and Recharts 3
- Search-based navigation via dynamic routes
- Active listings table with detailed specifications
- Historical charts for listing count, average price, and mileage

## Installation

Install dependencies:

```bash
pnpm install
```

Create a `.env` file:

```env
PGSQL_URL=postgresql://username:password@localhost:5432/autoscout24_trends
```

## Usage

Start the development server:

```bash
pnpm dev
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.js                   # Root layout
│   │   ├── page.js                     # Home page
│   │   ├── globals.css                 # Tailwind CSS v4 config
│   │   └── [searchName]/
│   │       └── page.js                 # Search detail page
│   ├── components/
│   │   ├── navbar.js                   # Navigation bar
│   │   ├── cars.js                     # Car listings table
│   │   ├── daily-listing-count.js      # Listing count chart
│   │   └── mileage-price-comparison.js # Mileage vs price chart
│   └── lib/
│       ├── data.js                     # Database queries
│       └── format.js                   # Formatting utilities
├── postcss.config.mjs                  # PostCSS / Tailwind plugin
└── package.json                        # Dependencies and scripts
```
