from sqlalchemy import Column, Integer, String, ForeignKey, Double, DATETIME
from app import db, app
from sqlalchemy.orm import relationship
from app.model.BookImage import BookImage
from app.model.ExtendedBook import ExtendedBook
from app.model.Order import OrderDetail
from app.model.CartItem import CartItem
from app.model.Cart import Cart
from app.model.FormImportDetail import FormImportDetail
from datetime import datetime


class Publisher(db.Model):
    __tablename__ = 'publisher'
    publisher_id = Column(Integer, primary_key=True, autoincrement=True)
    publisher_name = Column(String)
    created_at = Column(DATETIME, default=datetime.now())

    publisher_books_relation = db.relationship('Book', back_populates='publisher_info', lazy=True)

    def to_dict(self):
        return {
            'publisher_id': self.publisher_id,
            'publisher_name': self.publisher_name,
            'created_at': self.created_at
        }
