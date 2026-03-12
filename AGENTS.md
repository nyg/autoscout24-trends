# AGENTS.md

## Repo map
- This repo has two coupled parts: `crawler/` scrapes AutoScout24 into PostgreSQL, and `frontend/` reads the same DB directly to render charts/tables.
- The main cross-component contract is the PostgreSQL schema in `crawler/SCHEMA.sql` plus the `search_name`/`batch_id` semantics used by both `crawler/autoscout/pipelines.py` and `frontend/src/lib/data.js`.
- Generated artifacts live in `crawler/output/` (CSV exports, screenshots). Treat that directory as runtime output, not source.

## Fast paths
- Crawler entrypoint: `crawler/autoscout/spiders/search.py`
- DB writes: `crawler/autoscout/pipelines.py`
- CSV/email post-processing: `crawler/autoscout/exporters.py`, `crawler/autoscout/extensions.py`
- Frontend DB queries: `frontend/src/lib/data.js`
- Main UI route: `frontend/src/app/[searchName]/page.js`

## Developer workflows
- Frontend commands are the standard ones from `frontend/package.json`: `pnpm dev`, `pnpm build`, `pnpm lint`.
- The crawler is usually run from `crawler/` with `scrapy crawl search -a search_file=<file>.env`.
- `crawler/run-spiders.sh` is the operational path for batch runs: it creates `.venv` if missing, activates it, runs `pip install -r requirements.txt`, then crawls every file in `crawler/searches/*.env`.
- Crawler settings load env vars automatically via `load_dotenv()` in `crawler/autoscout/settings.py`, so `.env` is expected in `crawler/`.

## Crawler architecture and patterns
- `SearchSpider` loads a search config from `crawler/searches/*.env` and expects `name`, `emails`, and `url` keys in practice (`search.py` validates all three, even though README text says emails are optional).
- Search result pages yield `CarPageRequest`s; car detail pages are parsed from Next.js flight data via `njsparser`, not from visible HTML. Keep `_extract_flight_data()` in `search.py` in sync with site structure changes.
- The spider yields `SellerItem` before `CarItem`; `CarWithSellerCsvItemExporter` depends on that ordering to merge seller fields into exported car rows.
- `PostgreSQLPipeline` buffers sellers and cars separately, inserts sellers with `ON CONFLICT DO NOTHING`, then inserts cars with a shared `batch_id` fetched once per spider run.
- If you add/remove car fields, update all of these together: `crawler/autoscout/items.py`, `crawler/autoscout/pipelines.py`, `crawler/SCHEMA.sql`, and any frontend queries/components that read the field.
- Output CSV filenames are generated through `FEEDS` + `FEED_URI_PARAMS` in `crawler/autoscout/settings.py`; the filename uses a sanitized `search_name`, but DB rows keep the original display name.
- Email sending is implemented as a Scrapy extension (`EmailAfterFeedExport`) triggered on `feed_slot_closed`; it attaches the generated CSV only if the file exists and is non-empty.

## Frontend architecture and patterns
- The frontend uses App Router server components for data fetching and passes unresolved promises into client components, which call `use(data)` (`cars.js`, `daily-listing-count.js`, `mileage-price-comparison.js`). Preserve that pattern when adding new visualizations.
- `frontend/src/lib/data.js` owns all SQL. Prefer extending queries there instead of embedding SQL in pages/components.
- Route params are URL-encoded search names. `navbar.js` links with `encodeURIComponent(search.name)` and `[searchName]/page.js` decodes them before querying.
- “Active listings” means rows from the latest `batch_id` for a given `search_name`; “Previous listings” means the most recent older row per `vehicle_id` that is absent from the latest batch.
- The daily chart aggregates by `date_in`, not by listing creation time.
- Styling uses Tailwind utility classes with local UI primitives under `frontend/src/components/ui/`; avoid introducing a second styling system.

## Project-specific conventions
- Frontend formatting is intentionally non-default: 3-space indentation, single quotes, no semicolons (`frontend/eslint.config.mjs`). Match existing style exactly.
- Frontend imports use the `@/` alias (`frontend/jsconfig.json`, `components.json`).
- Python code follows straightforward Scrapy/PEP 8 style; keep changes small and local to the scraper pipeline.

## Integration pitfalls to remember
- `frontend/src/lib/data.js` connects with `postgres(process.env.PGSQL_URL)`, so frontend pages require the same DB env var as the crawler.
- Search names are user-facing labels stored in DB; do not replace them with slugified values in queries or routes.
- When changing seller/car relationships, remember the exporter and frontend both assume seller data is joinable by `seller_id`.
- Do not “clean up” `crawler/output/` or modify sample search files unless the task is explicitly about runtime data/configuration.
