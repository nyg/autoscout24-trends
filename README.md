# autoscout24-crawler

This crawler periodically scraps and stores into database the cars returned by
a set of search parameters, with the goal of being able to extract statistics
about these cars (price evolution, duration of listing, kms per year, km/price
ratio, etc.).

## Install

```sh
pip install -r requirements.txt
```

Create an `.env` file and set the `PGSQL_URL` variable to point to your PostgreSQL
database. Also create a free [resend.com][1] API key `RESEND_API_KEY` to be able to
receive results by email.

## Run

Create as many `*.env` file as you want in the `searches` directory and run the
extraction with the following command:

```sh
scrapy crawl search -a config_file=rs6.env
```

## Database schema

```sql
CREATE TABLE cars (
    -- Row information
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    search_name TEXT NOT NULL,
    url TEXT NOT NULL,
    json_data JSONB,
    date_in TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Meta & tracking
    title TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,

    -- Vehicule id
    vehicle_id TEXT NOT NULL,
    seller_vehicle_id TEXT,
    certification_number TEXT,

    -- Vehicle details
    price INTEGER,
    body_type TEXT,
    color TEXT,
    mileage INTEGER,
    has_additional_set_of_tires BOOLEAN,
    had_accident BOOLEAN,

    -- Mechanical specs
    fuel_type TEXT,
    kilo_watts INTEGER,
    cylinders INTEGER,
    avg_consumption NUMERIC,
    co2_emission INTEGER,

    -- Pricing & finance
    warranty BOOLEAN,
    leasing BOOLEAN,

    -- Dates
    created_date TIMESTAMP,
    last_modified_date TIMESTAMP,
    first_registration_date DATE,
    last_inspection_date DATE,

    -- Foreign keys & tracking
    seller_id TEXT REFERENCES sellers(id)
);

CREATE TABLE sellers (
    id TEXT PRIMARY KEY,
    type TEXT,
    name TEXT NOT NULL,
    address TEXT,
    zip_code TEXT,
    city TEXT
);
```

[1]: https://resend.com