from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DATETIME, Double
from app import db, app
from app.model import Book
from enum import Enum as PythonEnum


class Address(db.Model):
    address_id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column('firstName', String, nullable=False)
    last_name = Column('lastName', String, nullable=False)
    phone_number = Column('phoneNumber', String)
    city = Column(String)
    district = Column(String)
    ward = Column(String)
    address = Column(String)

    user_id = Column(Integer, ForeignKey('user.user_id'))
    order = relationship("Order", back_populates="address")

    def to_dict(self):
        return {
            'address_id': self.address_id,
            'fullname': self.get_fullname(),
            'phone_number': self.phone_number,
            'address': self.address,
            'province': self.to_string_without_user()
        }

    def to_string_without_user(self):
        return self.ward + ', ' + self.district + ', ' + self.city

    def get_fullname(self):
        return self.last_name + ' ' + self.first_name
