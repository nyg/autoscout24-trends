CREATE TABLE IF NOT EXISTS public.config (
    key text NOT NULL,
    value text NOT NULL DEFAULT '',
    CONSTRAINT config_pkey PRIMARY KEY (key)
);
