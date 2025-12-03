from datetime import datetime

from scrapy import Item, Field


def format_bool(value):
    return 'Yes' if value else 'No'


def format_datetime(value):
    return value.strftime('%Y-%m-%d %H:%M:%S')


def format_date(value):
    return value.date().isoformat()


class CarItem(Item):
    search_name = Field()
    url = Field()
    json_data = Field()

    title = Field()
    subtitle = Field()
    description = Field()

    vehicle_id = Field()
    seller_vehicle_id = Field()
    certification_number = Field()

    price = Field()
    body_type = Field()
    color = Field()
    mileage = Field()
    has_additional_set_of_tires = Field(type=bool, serializer=format_bool)
    had_accident = Field(type=bool, serializer=format_bool)

    fuel_type = Field()
    kilo_watts = Field()
    cm3 = Field()
    cylinders = Field()
    cylinder_layout = Field()
    avg_consumption = Field()
    co2_emission = Field()

    warranty = Field(type=bool, serializer=format_bool)
    leasing = Field(type=bool, serializer=format_bool)

    created_date = Field(type=datetime, serializer=format_datetime)
    last_modified_date = Field(type=datetime, serializer=format_datetime)
    first_registration_date = Field(type=datetime, serializer=format_date)
    last_inspection_date = Field(type=datetime, serializer=format_date)

    seller_id = Field()

    def merge_with(self, seller):
        car = dict(self)
        car.pop('search_name')
        car.pop('seller_id')

        car['seller_name'] = seller['name']
        car['seller_zip_code'] = seller['zip_code']
        car['seller_city'] = seller['city']

        return car

    def __repr__(self):
        return repr({
            'vehicle_id': self['vehicle_id'],
            'title': self['title']
        })

    @staticmethod
    def parse_response(search_name, url, json_response):
        car = CarItem()

        car['search_name'] = search_name
        car['url'] = url
        car['json_data'] = json_response

        car['title'] = json_response['pageViewTracking']['listing_typename']
        car['subtitle'] = json_response['listing']['teaser']
        car['description'] = json_response['listing']['description']

        car['vehicle_id'] = json_response['listing']['id']
        car['seller_vehicle_id'] = json_response['listing']['sellerVehicleId']
        car['certification_number'] = json_response['listing']['certificationNumber']

        car['price'] = json_response['listing']['price']
        car['body_type'] = json_response['listing']['bodyType']
        car['color'] = json_response['listing']['bodyColor']
        car['mileage'] = json_response['listing']['mileage']
        car['has_additional_set_of_tires'] = json_response['listing']['hasAdditionalSetOfTires']
        car['had_accident'] = json_response['listing']['hadAccident']

        car['fuel_type'] = json_response['listing']['fuelType']
        car['kilo_watts'] = json_response['listing']['kiloWatts']
        car['cm3'] = json_response['listing']['cubicCapacity']
        car['cylinders'] = json_response['listing']['cylinders']
        car['cylinder_layout'] = json_response['listing']['cylinderArrangement']
        car['avg_consumption'] = json_response['listing']['consumption']['combined']
        car['co2_emission'] = json_response['listing']['co2Emission']

        car['warranty'] = json_response['listing']['warranty']['type'] != 'none'
        car['leasing'] = json_response['listing']['leasing'] is not None

        car['created_date'] = datetime.fromisoformat(json_response['listing']['createdDate'])
        car['last_modified_date'] = datetime.fromisoformat(json_response['listing']['lastModifiedDate'])
        car['first_registration_date'] = datetime.fromisoformat(json_response['listing']['firstRegistrationDate'])

        last_inspection = json_response['listing']['lastInspectionDate']
        car['last_inspection_date'] = datetime.fromisoformat(last_inspection) if last_inspection is not None else None

        car['seller_id'] = json_response['seller']['id']
        return car


class SellerItem(Item):
    id = Field()
    type = Field()
    name = Field()
    address = Field()
    zip_code = Field()
    city = Field()

    def __repr__(self):
        return repr({
            'id': self['id'],
            'name': self['name']
        })

    @staticmethod
    def parse_response(json_response):
        seller = SellerItem()
        seller['id'] = json_response['id']
        seller['type'] = json_response['type']
        seller['name'] = json_response['name']
        seller['address'] = json_response['address']
        seller['zip_code'] = json_response['zipCode']
        seller['city'] = json_response['city']
        return seller
