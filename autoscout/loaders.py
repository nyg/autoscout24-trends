import re
from datetime import datetime

from itemloaders.processors import TakeFirst, MapCompose
from scrapy.loader import ItemLoader


def parse_price(value):
    return int(re.sub(r'\D', '', value))


def parse_power(value):
    match = re.search(r'\((\d+) kW\)', value)
    return int(match.group(1)) if match else 0


def parse_mileage(value):
    return int(re.sub(r'\D', '', value))


def parse_registration_date(value):
    return datetime.strptime(value, '%m.%Y')


class CarLoader(ItemLoader):
    default_output_processor = TakeFirst()

    price_in = MapCompose(str.strip, parse_price)
    power_in = MapCompose(str.strip, parse_power)
    mileage_in = MapCompose(str.strip, parse_mileage)
    registration_date_in = MapCompose(str.strip, parse_registration_date)
