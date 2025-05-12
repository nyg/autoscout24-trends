# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

from scrapy import Item, Field


class CarItem(Item):
    title = Field()
    subtitle = Field()
    mileage = Field(serializer=int)
    price = Field(serializer=int)
    registration_date = Field()
    seller = Field()
    location = Field()
