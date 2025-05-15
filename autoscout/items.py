from scrapy import Item, Field


class CarItem(Item):
    url = Field()
    title = Field()
    subtitle = Field()
    mileage = Field(serializer=int)
    price = Field(serializer=int)
    registration_date = Field()
    seller = Field()
    location = Field()
