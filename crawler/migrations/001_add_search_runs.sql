-- Migration: Replace cars.batch_id with search_run_id FK to new search_runs table
-- Run this BEFORE deploying the new code.

BEGIN;

-- 1. Create search_runs table
CREATE TABLE public.search_runs (
    id integer NOT NULL,
    search_id integer NOT NULL,
    started_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at timestamp without time zone,
    finish_reason text,
    success boolean,
    cars_found integer,
    cars_scraped integer,
    request_count integer,
    failed_request_count integer,
    stats jsonb
);

ALTER TABLE public.search_runs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.search_runs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

ALTER TABLE ONLY public.search_runs
    ADD CONSTRAINT search_runs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.search_runs
    ADD CONSTRAINT search_runs_search_id_fkey FOREIGN KEY (search_id) REFERENCES public.searches(id);

-- 2. Backfill: create a search_runs row for each distinct (batch_id, search_id) in cars
INSERT INTO search_runs (id, search_id)
    OVERRIDING SYSTEM VALUE
    SELECT DISTINCT batch_id, search_id
      FROM cars
     ORDER BY batch_id;

-- 3. Advance the identity sequence past existing values
SELECT setval('search_runs_id_seq', COALESCE((SELECT MAX(id) FROM search_runs), 0) + 1, false);

-- 4. Rename batch_id → search_run_id in cars
ALTER TABLE public.cars RENAME COLUMN batch_id TO search_run_id;

-- 5. Add FK constraint
ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_search_run_id_fkey FOREIGN KEY (search_run_id) REFERENCES public.search_runs(id);

-- 6. Drop the old sequence
DROP SEQUENCE IF EXISTS car_batch_id_seq;

COMMIT;
