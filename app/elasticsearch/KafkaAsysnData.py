import pdb

from app.dao.BookDAO import find_by_id
from app.elasticsearch.BookIndexService import delete_document, create_document, update_document, \
    add_attribute_value_document, update_document_bulk
from app.exception.NotFoundError import NotFoundError


def create(book_id):
    book_document = find_by_id(book_id).to_dto()
    if book_document is None: raise NotFoundError("Khong tim thay sach")
    create_document(book_document)


def update_image(data):
    pass


def update_book_document(book_id, updated_fields):
    book_document = find_by_id(book_id)
    if book_document is None: raise NotFoundError("Khong tim thay sach")
    update_document(book_document.book_id, updated_fields)


def add_attribute_value(data):
    book_document = find_by_id(data['book_id'])
    if book_document is None: raise NotFoundError("Khong tim thay sach")

    extended_books = [ex.to_dto() for ex in book_document.extended_books]
    add_attribute_value_document(book_document.book_id, extended_books)


def modify_attribute_value(book_id):
    book_document = find_by_id(book_id)
    if book_document is None: raise NotFoundError("Khong tim thay sach")

    updated_field = [ex.to_dto() for ex in book_document.extended_books]
    update_document(book_document.book_id, {"extended_books": updated_field})


# def modify_attribute(attribute_id):
#     extended_books = ExtendedBook.query.filter(ExtendedBook.attribute_id == attribute_id).all()
#     if extended_books is None: raise NotFoundError("Khong tim thay sach")
#
#     book = [ex.book for ex in extended_books]
#     update_document_bulk(book, 'extended_books')


def delete(book_id):
    book = find_by_id(book_id)
    if book is None: raise NotFoundError("Khong tim thay sach")
    delete_document(book.book_id)
