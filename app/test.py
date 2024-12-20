from sqlalchemy import Column, Integer, String, ForeignKey, Double
from app import db
from app.model.BookImage import ImageOfBook
from enum import Enum
from babel.numbers import format_currency
import functools
from datetime import datetime, timezone
import locale

class Status(Enum):
    LE = 1
    TAN = 2
    PHAT = 3

obj = {
    "name": "Phat",
    "age": 12
}

print(datetime.utcnow())
print(format_currency(120222, "VND", locale='vi_VN'))

# print(Status.LE.value.__eq__('1'))

# obj1 = {
#     'name': 'phat',
#     'age': 12
# }
#
# obj2 = [
#     {
#         'width': 2,
#         'height': 2
#     }, {
#         'width': 3,
#         'height': 3
#
#     }
# ]
#
# x = functools.reduce(lambda a, b: a['width'] * a['height'] + b['width'] * b['height'], obj2)
# print(x)
print(datetime.now())
locale.setlocale(locale.LC_TIME, "vi_VN.UTF-8")
datetime_str = "2024-01-19 03:14:07"

# Original datetime
dt = datetime.strptime(datetime_str, "%Y-%m-%d %H:%M:%S")
print(dt)
# Format components
weekday = dt.strftime("%a")  # Short weekday in Vietnamese (e.g., Th 6)
day = dt.day  # Day of the month
month = dt.month  # Numeric month
year = dt.year  # Year
time = dt.strftime("%H:%M:%S")  # Time in 24-hour format

# Combine into desired format
formatted_date = f"{weekday}, {day}/{month}/{year} - {time}"
print(formatted_date)

"""
    Already existed in database
    case 1: {
        id: 12,
        phone_number: 12
    }

    Newly created 
    case 2: {
        id: null,
        phone_number: 12
    }

    Null value allowed
    case 3: {}   
"""

obj = {
    "1": 12,
    "b": ''
}
date_str = '12-15-2023'

date_object = datetime.strptime(date_str, '%m-%d-%Y')
print(type(date_object))

date_object = datetime.strptime(date_str, '%m-%d-%Y').date()
print(type(date_object))


# printed in default format
# if obj["1"] is not None and obj["b"] is not None:
#     print("ok")

# customer_id_ok = customer_info['id'] is not None or bool(customer_info)
# customer_phone_ok = (customer_info['phone_number'] is not None or customer_info['phone_number'] == 0) or bool(customer_info
#
# if customer_id_ok and customer_phone_ok
#
# if not customer_id_ok and not customer_phone_ok
#
# if customer_phone_ok
#
# return null
#
#
# if customer_info['id'] is not None and customer_info['phone_number'] is not None and customer_info['phone_number'] != 0:
#
# if bool(customer_info) or  (customer_info['id'] is None and (customer_info['phone_number'] is None or customer_info['phone_number'] == 0)):
#
# if customer_info['phone_number'] is None or customer_info['phone_number'] == 0: return loi
#
# => Xu ly so dien thoai