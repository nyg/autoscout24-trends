# AGENTS.md

This is the canonical repo guide for humans and coding agents. Keep repository-specific architecture, workflows, conventions, and integration pitfalls here, and keep `.github/copilot-instructions.md` short and Copilot-specific.

## Repo map
- This repo has two coupled parts: `crawler/` scrapes AutoScout24 into PostgreSQL, and `frontend/` reads the same DB directly to render charts/tables.
- The main cross-component contract is the PostgreSQL schema in `crawler/SCHEMA.sql` plus the `search_name`/`batch_id` semantics used by both `crawler/autoscout/pipelines.py` and `frontend/src/lib/data.js`.
- Generated artifacts live in `crawler/output/` (CSV exports, screenshots). Treat that directory as runtime output, not source.

## Fast paths
- Crawler entrypoint: `crawler/autoscout/spiders/search.py`
- DB writes: `crawler/autoscout/pipelines.py`
- CSV/email post-processing: `crawler/autoscout/exporters.py`, `crawler/autoscout/extensions.py`
- Frontend DB queries: `frontend/src/lib/data.js`
- Main UI route: `frontend/src/app/search/[searchName]/page.js`
- Settings page: `frontend/src/app/settings/page.js`
- Cars table (sorting, column visibility, seller cell): `frontend/src/components/cars.js`
- Google Places integration: `frontend/src/components/place-details.js`
- Number/date formatting: `frontend/src/lib/format.js`

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
- Route params are URL-encoded search names. `navbar.js` links with `encodeURIComponent(search.name)` and `search/[searchName]/page.js` decodes them before querying.
- "Active listings" means rows from the latest `batch_id` for a given `search_name`; "Previous listings" means the most recent older row per `vehicle_id` that is absent from the latest batch.
- The daily chart aggregates by `date_in`, not by listing creation time.
- Styling uses Tailwind utility classes with local UI primitives under `frontend/src/components/ui/`; avoid introducing a second styling system.
- UI primitives (`button`, `card`, `chart`, `dropdown-menu`, `popover`, `table`, `tooltip`) wrap `@base-ui/react` and shadcn-generated foundations.

## Cars table (`cars.js`)
- Column definitions live in the `COLUMNS` array at the top of the file. Add new columns there (key, label, sortType, sortKey, align, defaultVisible).
- Sorting: click column headers to toggle asc/desc. Sort comparison is type-aware (numeric, text, date). Default sort is price ascending.
- Column visibility: stored in localStorage (`'car-table-visible-columns'`), synced across tables via a custom `'visible-columns-changed'` event (since `storage` events only fire in other tabs). Uses `useSyncExternalStore` with a server snapshot of default columns to avoid hydration mismatches.
- Seller cell: shows seller name (truncated), location, and three icons — Google Maps link (MapPinIcon), directions from home (NavigationIcon, requires home address in Settings), and place details popover (MapIcon, requires Google Maps API key, disabled for private sellers).
- Text truncation: title (100 chars), description (100 chars, scrollable tooltip), seller name (30 chars). All use `TruncatedText` component with `Tooltip`.

## Settings page (`/settings`)
- Stores Google Maps API key (`'google-maps-api-key'`) and home address (`'home-address'`) in localStorage.
- Maps API key is consumed by `place-details.js` via `useSyncExternalStore` in `cars.js`.
- Home address is consumed by the directions link in `SellerCell` via `useSyncExternalStore`.
- Does not dispatch custom events itself; components that depend on these values read them from localStorage (e.g. via `useSyncExternalStore`) for same-tab sync.

## Google Places integration (`place-details.js`)
- Uses `@googlemaps/js-api-loader` v2 functional API: `setOptions()` + `importLibrary('places')`.
- Uses the new `Place` class (`Place.searchByText()` + `place.fetchFields()`), NOT the deprecated `PlacesService`.
- Module-level cache (`placeCache` Map) keyed by `"sellerName|zipCode|city"` avoids redundant API calls.
- Requires **Maps JavaScript API** and **Places API (New)** enabled in Google Cloud Console.

## Locale formatting (`format.js`)
- Number and date formatters use `navigator.language` on the client with `'fr-CH'` server fallback.
- Since SSR and client locales may differ, `cars.js` forces a post-hydration re-render (`useReducer` + `useEffect`) so client locale formatters replace server-rendered text. Formatted cells keep `suppressHydrationWarning` to avoid console errors during the brief SSR→client transition.
- Charts (Recharts) render client-only, so they use client formatters directly without hydration issues.

## Project-specific conventions
- Frontend formatting is intentionally non-default: 3-space indentation, single quotes, no semicolons (`frontend/eslint.config.mjs`). Match existing style exactly.
- Frontend imports use the `@/` alias (`frontend/jsconfig.json`, `components.json`).
- Python code follows straightforward Scrapy/PEP 8 style; keep changes small and local to the scraper pipeline.

## Integration pitfalls to remember
- `frontend/src/lib/data.js` connects with `postgres(process.env.PGSQL_URL)`, so frontend pages require the same DB env var as the crawler.
- Search names are user-facing labels stored in DB; do not replace them with slugified values in queries or routes.
- When changing seller/car relationships, remember the exporter and frontend both assume seller data is joinable by `seller_id`.
- Do not "clean up" `crawler/output/` or modify sample search files unless the task is explicitly about runtime data/configuration.
- localStorage keys used by the frontend: `'car-table-visible-columns'`, `'google-maps-api-key'`, `'home-address'`. Avoid collisions.
- Seller types are only `'professional'` and `'private'`. Maps place details are only shown for professional sellers. Address building differs by type: private → "address, zip_code city", professional → "name, address, zip_code city".
