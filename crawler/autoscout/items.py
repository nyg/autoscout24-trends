from datetime import datetime

from scrapy import Item, Field


def parse_iso_datetime(value):
    try:
        return datetime.fromisoformat(value)
    except (ValueError, TypeError):
        return None


class CarItem(Item):
    search_id = Field()
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
    has_additional_set_of_tires = Field()
    had_accident = Field()

    fuel_type = Field()
    kilo_watts = Field()
    cm3 = Field()
    cylinders = Field()
    cylinder_layout = Field()
    avg_consumption = Field()
    co2_emission = Field()

    warranty = Field()
    leasing = Field()

    created_date = Field()
    last_modified_date = Field()
    first_registration_date = Field()
    last_inspection_date = Field()

    seller_id = Field()
    screenshot = Field()
    screenshot_id = Field()

    def __repr__(self):
        return repr({
            'vehicle_id': self['vehicle_id'],
            'title': self['title']
        })

    @staticmethod
    def parse_response(search_id, url, json_response):
        car = CarItem()

        car['search_id'] = search_id
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

        car['created_date'] = parse_iso_datetime(json_response['listing']['createdDate'])
        car['last_modified_date'] = parse_iso_datetime(json_response['listing']['lastModifiedDate'])
        car['first_registration_date'] = parse_iso_datetime(json_response['listing']['firstRegistrationDate'])

        last_inspection = json_response['listing']['lastInspectionDate']
        car['last_inspection_date'] = parse_iso_datetime(last_inspection)

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
        seller['name'] = json_response['name'] or 'Unknown seller'
        seller['address'] = json_response['address']
        seller['zip_code'] = json_response['zipCode']
        seller['city'] = json_response['city']
        return seller
