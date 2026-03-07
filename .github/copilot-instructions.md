# Copilot Instructions

## Project Overview

AutoScout24 Trends is a two-component application:

1. **Crawler** (`crawler/`) – A Python [Scrapy](https://scrapy.org/) spider that periodically scrapes AutoScout24 search results and stores car and seller data in a PostgreSQL database. It uses [SeleniumBase](https://seleniumbase.io/) CDP mode to bypass CloudFlare protection.
2. **Frontend** (`frontend/`) – A [Next.js](https://nextjs.org/) web application that visualises the stored data using [Recharts](https://recharts.org/) and styled with [Tailwind CSS](https://tailwindcss.com/) and [DaisyUI](https://daisyui.com/).

## Repository Structure

```
autoscout24-trends/
├── crawler/
│   ├── autoscout/          # Scrapy project package
│   │   ├── spiders/        # Scrapy spiders (search.py)
│   │   ├── items.py        # Scrapy item definitions
│   │   ├── pipelines.py    # PostgreSQL pipeline
│   │   ├── exporters.py    # CSV exporter
│   │   ├── extensions.py   # Scrapy extensions
│   │   └── settings.py     # Scrapy settings
│   ├── searches/           # Search definition files (.env format)
│   ├── requirements.txt    # Python dependencies
│   ├── SCHEMA.sql          # PostgreSQL schema
│   └── run-spiders.sh      # Shell script to run all spiders
└── frontend/
    ├── src/
    │   ├── app/            # Next.js App Router pages
    │   ├── components/     # React components
    │   └── lib/            # Shared utilities and DB queries
    ├── package.json
    └── eslint.config.mjs
```

## Crawler

### Setup

```shell
cd crawler
python -m venv venv
. venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file based on `.env.example` and set `PGSQL_URL` and `RESEND_API_KEY`.

### Running

```shell
scrapy crawl search -a search_file=<search-file-in-searches-folder>
```

### Conventions

- Python code follows standard PEP 8 style.
- Spider logic lives in `autoscout/spiders/search.py`.
- Database writes are handled by `PostgreSQLPipeline` in `pipelines.py`.
- Email delivery uses the [resend](https://resend.com) API.
- Search configuration files are stored in `searches/` in `.env` format.

## Frontend

### Setup

```shell
cd frontend
pnpm install
```

### Commands

```shell
pnpm dev      # Start development server (Turbopack)
pnpm build    # Production build
pnpm lint     # Run ESLint
```

### Conventions

- **Indentation**: 3 spaces.
- **Quotes**: Single quotes for strings.
- **Semicolons**: Omitted (no semicolons at end of statements).
- Framework: Next.js App Router (`src/app/`).
- Styling: Tailwind CSS v4 + DaisyUI v5.
- Charts: Recharts.
- Database access: [`postgres`](https://github.com/porsager/postgres) npm package connecting to PostgreSQL.
- Package manager: `pnpm`.
