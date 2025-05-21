from scrapy.exporters import CsvItemExporter

from autoscout.items import CarItem, SellerItem


class CarWithSellerCsvItemExporter(CsvItemExporter):
    def __init__(self, *args, **kwargs):
        self.car_items = {}
        self.seller_items = {}
        super().__init__(*args, **kwargs)

    def export_item(self, item):
        match item:
            case SellerItem() as seller:
                self.seller_items[seller['id']] = seller
            case CarItem() as car:
                seller = self.seller_items[car['seller_id']]
                car_with_seller = car.merge_with(seller)
                super().export_item(car_with_seller)
