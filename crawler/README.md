# Crawler

This crawler is composed of one [Scrapy spider][1] called `search`. It takes a
search file as argument which contains a name, an AutoScout24 search URL and a
list of email addresses. The spider will perform the following steps:

1. crawl the search URL and all cars returned by this search URL,
2. store the cars and sellers into database (see `PostgreSQLPipeline` in
   `pipeline.py`),
3. generate a CSV file (see `CarWithSellerCsvItemExporter` in `exporter.py`),
4. email the given addresses with the CSV file in attachment.

## Run the spider

`venv` is optional but creates an isolated Python environment to avoid conflicts
between projects.

Create an `.env` file and set the `PGSQL_URL` variable to point to your
PostgreSQL database. Also create a free [resend.com][2] API key `RESEND_API_KEY`
to receive results by email.

```shell
# create the virtual environment
python -m venv venv

# activate the virtual environment
. venv/bin/activate

# run the `search` spider (search file should be placed in the `searches/` folder)
scrapy crawl search -a search_file=rs6.env

# when done, deactivate the virtual environment
deactivate
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

[1]: https://docs.scrapy.org/en/latest/topics/spiders.html

[2]: https://resend.com
