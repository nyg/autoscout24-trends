CREATE TABLE public.cars (
    id integer NOT NULL,
    search_name text NOT NULL,
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
    batch_id integer NOT NULL,
    cm3 integer,
    cylinder_layout text
);


ALTER TABLE public.cars ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cars_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE SEQUENCE car_batch_id_seq;


CREATE TABLE public.sellers (
    id text NOT NULL,
    type text,
    name text NOT NULL,
    address text,
    zip_code text,
    city text
);


ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (id);


ALTER TABLE ONLY public.cars
    ADD CONSTRAINT cars_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(id);
