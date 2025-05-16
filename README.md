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
database. Also create a free [resend.dev][1] API key `RESEND_API_KEY` to be able to
receive results by email.

## Run

Create as many `*.env` file as you want in the `searches` directory and run the
extraction with the following command:

```sh
scrapy crawl search -a config_file=rs6.env
```

## Database schema

```sql
CREATE TABLE IF NOT EXISTS cars (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       TEXT NOT NULL,
    subtitle    TEXT,
    mileage     INTEGER,
    price       INTEGER NOT NULL,
    power       INTEGER,
    registration_date DATE,
    seller      TEXT,
    location    TEXT,
    url         TEXT NOT NULL,
    date_in     TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT cars_mileage_check CHECK ((mileage >= 0)),
    CONSTRAINT cars_price_check CHECK ((price >= 0))
);
```

[1]: https://resend.dev