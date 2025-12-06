# Crawler

This crawler is composed of one [Scrapy spider][1] called `search`. It takes a
search file as argument which contains a name, an AutoScout24 search URL and a
list of email addresses. The spider will perform the following steps:

1. crawl the search URL and all cars returned by this search URL,
2. store the cars and sellers into database (see `PostgreSQLPipeline` in
   `pipeline.py`),
3. generate a CSV file (see `CarWithSellerCsvItemExporter` in `exporter.py`),
4. email the given addresses with the CSV file in attachment.

The spider uses [SeleniumBase](https://seleniumbase.io/)'s pure CDP mode to
bypass AutoScout24's anti-bot protections (currently CloudFlare).

## Running the spider

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

## Adding a cron job

```shell
# edit the crontab file
crontab -e

# add this line to run the spiders daily, change path if needed
0 0 * * * ~/.local/share/autoscout24-trends/crawler/run-spiders.sh

# list jobs in crontab file
crontab -l
```

## Linux dependencies

```shell
sudo apt install chromium xvfb
```

## Database schema

See [SCHEMA.sql](SCHEMA.sql).


[1]: https://docs.scrapy.org/en/latest/topics/spiders.html

[2]: https://resend.com
