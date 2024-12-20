import random
from datetime import datetime, timedelta
from platform import release
from sqlalchemy.sql import text

import cloudinary

from app.exception.NotFoundError import NotFoundError
from app.model.Attribute import Attribute
from app.model.Book import Book, BookFormat
from app import app, db
from app.model.BookGerne import BookGerne
from app.model.Book import Book
import math

from app.model.BookImage import BookImage
from app.model.ExtendedBook import ExtendedBook
from app.model.Order import Order
from app.model.Publisher import Publisher
from app.utils.helper import FORMAT_BOOK_TEXT


def find_by_id(id):
    return Book.query.get(id)


def count_book_sell(book_id):
    query = text(
        """
               select sum(od.quantity) as sold from (
                       select * from order_detail od
                       where od.order_id not in (select order_id from order_cancellation)
                   ) as od , book b
                   where od.book_id = b.book_id
                   and b.book_id = :book 
           """)
    result = db.session.execute(query, {'book': book_id}).fetchone()
    return result.sold if result.sold else 0


def create_book(data):
    book = Book(title=data['title'], author=data['author'], price=data['price'],
                num_page=data['num_page'], description=data['description'],
                release_date=data['release_date'],
                weight=data['weight'], book_gerne_id=data['book_gerne_id'], dimension=data['dimension'])

    book_images = data['book_images']
    if data['publisher']:
        publisher = Publisher.query.get(data['publisher'])
        if publisher is None: raise NotFoundError('Publisher not found')
        book.publisher = publisher

    if data['format']:
        book.format = BookFormat(data['format'])

    if book_images:
        for image in book_images:
            res = cloudinary.uploader.upload(image)
            image_url = res['secure_url']
            new_image = BookImage(image_url=image_url)
            book.images.append(new_image)

    extend_attributes = data['extend_attributes']
    if extend_attributes:
        for extend_attribute in extend_attributes:
            attribute = Attribute.query.get(int(extend_attribute['attribute_id']))
            if attribute is None:
                raise NotFoundError("Không tìm thấy attribute")

            new_attribute = ExtendedBook(attribute_id=attribute.attribute_id, value=extend_attribute['value'])
            book.extended_books.append(new_attribute)

    db.session.add(book)
    db.session.commit()


def increase_book_quantity(id, quantity):
    book = Book.query.get(id)
    book.quantity = book.quantity + quantity
    db.session.commit()


def find_by_barcode(barcode):
    book = Book.query
    book = book.filter(Book.barcode == barcode)
    return book.first()


def find_by_gerne(gerne_id):
    query = Book.query
    gerne = BookGerne.query.get(gerne_id)
    query = query.join(BookGerne)
    query = query.filter(BookGerne.lft.between(gerne.lft, gerne.rgt))
    return query.all()


def find_all(page=1):
    return Book.query.all()


def paginate_book(page=1, limit=app.config['PAGE_SIZE']):
    page_size = limit
    start = (page - 1) * page_size
    end = start + page_size
    total = Book.query.count()
    total_page = math.ceil(total / page_size)
    books = Book.query.slice(start, end).all()

    return {
        'total_book': total,
        'current_page': page,
        'pages': total_page,
        'books': books
    }


def find_by_barcode(barcode):
    return Book.query.filter(Book.barcode.__eq__(barcode))


def countBook():
    return Book.query.count()
