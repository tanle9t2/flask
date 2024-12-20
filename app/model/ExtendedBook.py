from sqlalchemy import Table, Column, Integer, ForeignKey, String
from app import db
from app.model.Attribute import Attribute


class ExtendedBook(db.Model):
    __tablename__ = 'extended_book'
    book_id = Column(Integer, ForeignKey('book.book_id'), primary_key=True)
    attribute_id = Column(Integer, ForeignKey('attribute.attribute_id'), primary_key=True)
    value = Column(String(50))

    book = db.relationship('Book', back_populates='extended_books')
    attribute = db.relationship('Attribute', back_populates='extended_books')

    def to_dict(self):
        return {
            'book_id': self.book_id,
            'attribute_name': self.attribute.attribute_name,
            'value': self.value
        }

    def to_dto(self):
        return {
            "attribute_id": self.attribute_id,
            'attribute_name': self.attribute.attribute_name,
            "value": self.value
        }
