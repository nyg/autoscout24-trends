-- Migration: Move search config from .env files to database
--
-- This migration:
-- 1. Creates the `searches` table
-- 2. Populates it from distinct search_name values in `cars`
-- 3. Adds `search_id` FK column to `cars`
-- 4. Populates search_id by matching search_name → searches.name
-- 5. Makes search_id NOT NULL and drops search_name
--
-- Before running, ensure you have a backup of your database.
-- After running, update the `url` column in `searches` for each entry
-- (the migration sets a placeholder since URLs were not stored in the DB).

BEGIN;

-- 1. Create searches table
CREATE TABLE IF NOT EXISTS public.searches (
    id integer NOT NULL GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL,
    url text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT searches_pkey PRIMARY KEY (id),
    CONSTRAINT searches_name_key UNIQUE (name)
);

-- 2. Populate searches from existing car data
-- URL is set to a placeholder — update it manually after migration
INSERT INTO searches (name, url)
SELECT DISTINCT search_name, 'https://www.autoscout24.ch — UPDATE THIS URL'
  FROM cars
ON CONFLICT (name) DO NOTHING;

-- 3. Add search_id column (nullable initially)
ALTER TABLE cars ADD COLUMN IF NOT EXISTS search_id integer;

-- 4. Populate search_id from searches.name matching cars.search_name
UPDATE cars c
   SET search_id = s.id
  FROM searches s
 WHERE c.search_name = s.name;

-- 5. Make search_id NOT NULL and add FK constraint
ALTER TABLE cars ALTER COLUMN search_id SET NOT NULL;
ALTER TABLE cars ADD CONSTRAINT cars_search_id_fkey
    FOREIGN KEY (search_id) REFERENCES searches(id);

-- 6. Drop the old search_name column
ALTER TABLE cars DROP COLUMN search_name;

COMMIT;
