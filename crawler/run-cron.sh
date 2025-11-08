#!/usr/bin/env sh
echo "Running scrapy crawl at $(date)" >> /home/user/cron.log
cd /home/user/dev/autoscout-visualizer/crawler
. venv/bin/activate
scrapy crawl search -a config_file=rs4.env
scrapy crawl search -a config_file=mx5.env
echo "Finished scrapy crawl at $(date)" >> /home/user/cron.log
