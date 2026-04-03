CREATE TABLE public.searches (
    id integer NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.searches ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.searches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


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


CREATE TABLE public.cars (
    id integer NOT NULL,
    search_id integer NOT NULL,
    url text NOT NULL,
    json_data jsonb,
    date_in timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    title text NOT NULL,
    subtitle text,
    description text,
    vehicle_id text NOT NULL,
    seller_vehicle_id text,
    certification_number text,
    price integer,
    body_type text,
    color text,
    mileage integer,
    has_additional_set_of_tires boolean,
    had_accident boolean,
    fuel_type text,
    kilo_watts integer,
    cylinders integer,
    avg_consumption numeric,
    co2_emission integer,
    warranty boolean,
    leasing boolean,
    created_date timestamp without time zone,
    last_modified_date timestamp without time zone,
    first_registration_date date,
    last_inspection_date date,
    seller_id text,
    search_run_id integer NOT NULL,
    cm3 integer,
    cylinder_layout text,
    screenshot_id integer
);


ALTER TABLE public.cars ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE public.sellers (
    id text NOT NULL,
    type text,
    name text NOT NULL,
    address text,
    zip_code text,
    city text
);


ALTER TABLE ONLY public.searches
    ADD CONSTRAINT searches_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.searches
    ADD CONSTRAINT searches_name_key UNIQUE (name);


ALTER TABLE ONLY public.search_runs
    ADD CONSTRAINT search_runs_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.search_runs
    ADD CONSTRAINT search_runs_search_id_fkey FOREIGN KEY (search_id) REFERENCES public.searches(id);


ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_search_id_fkey FOREIGN KEY (search_id) REFERENCES public.searches(id);


ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_search_run_id_fkey FOREIGN KEY (search_run_id) REFERENCES public.search_runs(id);


ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id);


CREATE TABLE public.screenshots (
    id integer NOT NULL,
    md5_hash character(32) NOT NULL,
    r2_key text NOT NULL,
    r2_url text NOT NULL,
    format text NOT NULL DEFAULT 'webp',
    width integer,
    height integer,
    original_size integer,
    compressed_size integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.screenshots ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.screenshots_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


ALTER TABLE ONLY public.screenshots
    ADD CONSTRAINT screenshots_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.screenshots
    ADD CONSTRAINT screenshots_md5_hash_key UNIQUE (md5_hash);


ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_screenshot_id_fkey FOREIGN KEY (screenshot_id) REFERENCES public.screenshots(id);


CREATE TABLE public.config (
    key text NOT NULL,
    value text NOT NULL DEFAULT ''
);


ALTER TABLE ONLY public.config
    ADD CONSTRAINT config_pkey PRIMARY KEY (key);
