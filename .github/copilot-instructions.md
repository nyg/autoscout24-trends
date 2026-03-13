# Copilot Instructions

Read `AGENTS.md` in the repository root first for the current architecture, cross-component contracts, and integration pitfalls. This file stays as a shorter Copilot-oriented summary.

## Project Overview

AutoScout24 Trends is a two-component application:

1. **Crawler** (`crawler/`) – A Python [Scrapy](https://scrapy.org/) spider that periodically scrapes AutoScout24 search results and stores car and seller data in a PostgreSQL database. It uses SeleniumBase CDP mode to bypass CloudFlare protection.
2. **Frontend** (`frontend/`) – A [Next.js](https://nextjs.org/) App Router application that reads the same PostgreSQL database directly and visualises listing data with [Recharts](https://recharts.org/) and Tailwind-based UI primitives.

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
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in `crawler/` and set `PGSQL_URL` and `RESEND_API_KEY`. Scrapy settings call `load_dotenv()` automatically.

### Running

```shell
scrapy crawl search -a search_file=<search-file-in-searches-folder>
```

For operational batch runs, use:

```shell
./run-spiders.sh
```

### Conventions

- Python code follows standard PEP 8 style.
- Spider logic lives in `autoscout/spiders/search.py`.
- Database writes are handled by `PostgreSQLPipeline` in `pipelines.py`.
- Email delivery uses the [resend](https://resend.com) API.
- Search configuration files are stored in `searches/` in `.env` format and in practice must contain `name`, `emails`, and `url`.
- Car pages are parsed from Next.js flight data (`njsparser`), not from the visible HTML.
- The spider yields `SellerItem` before `CarItem`; `autoscout/exporters.py` depends on that ordering.
- If you change car fields, keep `items.py`, `pipelines.py`, `SCHEMA.sql`, and frontend readers in sync.

## Frontend

### Setup

```shell
cd frontend
pnpm install
```

### Commands

```shell
pnpm dev
pnpm build    # Production build
pnpm lint     # Run ESLint
```

### Conventions

- **Indentation**: 3 spaces.
- **Quotes**: Single quotes for strings.
- **Semicolons**: Omitted (no semicolons at end of statements).
- Framework: Next.js App Router (`src/app/`).
- Styling: Tailwind CSS v4 with local UI primitives under `src/components/ui/` and shadcn-generated foundations.
- Charts: Recharts.
- Database access: [`postgres`](https://github.com/porsager/postgres) npm package connecting to PostgreSQL.
- Package manager: `pnpm`.
- Keep SQL in `src/lib/data.js`; pages and components consume those helpers instead of embedding SQL.
- Preserve the existing server/client pattern: server routes create unresolved data promises and client components consume them with `use(data)`.
- Search routes use URL-encoded display names: `navbar.js` encodes `search.name`, and `src/app/[searchName]/page.js` decodes before querying.
