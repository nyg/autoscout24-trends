#!/usr/bin/env sh
echo "Running scrapy crawl at $(date)" >> /home/user/cron.log
cd /home/user/dev/autoscout-visualizer/crawler
. venv/bin/activate
scrapy crawl search -a search_file=rs6.env
echo "Finished scrapy crawl at $(date)" >> /home/user/cron.log
