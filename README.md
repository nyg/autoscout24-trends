# autoscout24-crawler

This crawler periodically scraps and stores into database the cars returned by
a set of search parameters, with the goal of being able to extract statistics
about these cars (price evolution, duration of listing, kms per year, km/price
ratio, etc.)

## Install

```sh
pip install -r requirements.txt
```

Create a `.env` file and set the PGSQL_URL variable to point to your PostgreSQL database.

## Run

```sh
# example
scrapy crawl search -a lang=fr -a make=audi -a model=rs4 -a fuel=petrol \
                    -a mileage_to=80000 -a price_to=60000 -a cylinders_to=6 \
                    -a registration=2010 -o cars.json
```

## Database schema

```sql
CREATE TABLE IF NOT EXISTS cars (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       TEXT NOT NULL,
    subtitle    TEXT,
    mileage     INTEGER,
    price       INTEGER NOT NULL,
    registration_date DATE,
    seller      TEXT,
    location    TEXT,
    url         TEXT NOT NULL,
    date_in     TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT cars_mileage_check CHECK ((mileage >= 0)),
    CONSTRAINT cars_price_check CHECK ((price >= 0))
);
```