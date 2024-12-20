from babel.numbers import format_currency
import locale
from datetime import datetime

FORMAT_BOOK_TEXT = ["Bìa cứng", "Bìa mềm"]
ORDER_TYPE_TEXT = ["Đặt online", "Mua trực tiếp"]
ORDER_STATUS_TEXT = ["Đang xử lý", "Chờ giao hàng", "Đang giao hàng", "Đã hoàn thành", "Đã hủy", "Đang chờ thanh toán",
                     "Đã thanh toán", "Đang chờ nhận"]
PAYMENT_METHOD_TEXT = ["Thẻ", "Tiền mặt"]
SHIPPING_METHOD_TEXT = ["Giao hàng", "Tại cửa hàng"]

order_type = {
    '_score': {
        'field': '_score',
        'direction': 'desc',
    },
    'asc': {
        'field': 'price',
        'direction': 'asc',
    },
    'desc': {
        'field': 'price',
        'direction': 'desc',
    },
    'latest': {
        'field': 'created_at',
        'direction': 'desc',
    },
    'best_sell_week': {
        'field': 'price',
        'direction': 'desc',
    },
    'best_sell_price': {
        'field': 'price',
        'direction': 'desc',
    }
}

locale.setlocale(locale.LC_ALL, "vi-VN")
def format_currency_filter(price, currency='VND'):
    # Format the value using Babel's format_currency
    print('price', price)
    return format_currency(price, currency, locale='vi_VN')


def format_date_VN(dt=datetime.now()):
    return dt.strftime('%d.%m.%Y')


def format_datetime_filter(dt):
    locale.setlocale(locale.LC_TIME, "vi_VN.UTF-8")

    weekdays_vi = ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"]

    # Original datetime

    # Format components
    weekday = weekdays_vi[(dt.weekday())]  # Short weekday in Vietnamese (e.g., Th 6)
    day = dt.day  # Day of the month
    month = dt.month  # Numeric month
    year = dt.year  # Year
    time = dt.strftime("%H:%M:%S")  # Time in 24-hour format

    # Combine into desired format
    formatted_date = f"{weekday}, {day}/{month}/{year} - {time}"
    return formatted_date
