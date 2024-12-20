from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DATETIME, Double
from app import db, app
from app.utils.helper import *
import functools
from app.model import Book, User, Address
from enum import Enum as PythonEnum


# TYPE = 1 => DAT_SHIP_VE_NHA
# TYPE = 2 => DAT_DEN_LAY
# TYPE = 3 => MUA_TAI_CHO


class OrderStatus(PythonEnum):
    DANG_XU_LY = 1
    CHO_GIAO_HANG = 2
    DANG_GIAO_HANG = 3
    DA_HOAN_THANH = 4
    DA_HUY = 5
    DANG_CHO_THANH_TOAN = 6
    DA_THANH_TOAN = 7
    DANG_CHO_NHAN_HANG = 8

class PaymentMethod(PythonEnum):
    THE = 1
    TIEN_MAT = 2


class ShippingMethod(PythonEnum):
    GIAO_HANG = 1
    CUA_HANG = 2


class Order(db.Model):
    __tablename__ = 'order'
    order_id = Column(Integer, primary_key=True, autoincrement=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.DANG_XU_LY)
    payment_method = Column(Enum(PaymentMethod))
    created_at = Column(DATETIME)

    address_id = Column(Integer, ForeignKey('address.address_id'))
    address = relationship("Address", back_populates="order", lazy=True)

    # user_id = Column(Integer, ForeignKey('user.user_id'))

    order_detail = relationship("OrderDetail", back_populates='order', lazy=True, cascade="all")
    online_order = relationship('OnlineOrder', backref='order', lazy=True, uselist=False, cascade="all")
    offline_order = relationship('OfflineOrder', back_populates='order', enable_typechecks=False, lazy=True,
                                 uselist=False, cascade="all")
    payment_detail = relationship('PaymentDetail', back_populates='order', lazy=True, uselist=False, cascade="all")

    customer_id = Column(Integer, ForeignKey('user.user_id'))
    customer = relationship("User", back_populates="orders", foreign_keys=[customer_id])

    def get_amount(self):
        amount = 0
        for od in self.order_detail:
            amount += od.get_price()

        return amount

    def to_dict(self):
        json = {
            'order_id': self.order_id,
            'status': {
                'id': self.status.value,
                'name': ORDER_STATUS_TEXT[self.status.value - 1],
            },
            'payment': {
                'payment_method': {
                    'id': self.payment_method.value,
                    'name': PAYMENT_METHOD_TEXT[self.payment_method.value - 1]
                }
            },
            'address': self.address.to_dict(),
            'created_at': self.created_at,
            'customer_id': self.customer_id,
            'total_amount': self.get_amount(),
        }
        return json

    def to_detail_dict(self):
        json = self.to_dict()
        json['order_detail'] = [order_detail.to_dict() for order_detail in self.order_detail]
        if self.payment_detail:
            json['payment']['payment_detail'] = self.payment_detail.to_dict()
        return json

    def get_shipping_fee(self):
        return 0


class OfflineOrder(Order):
    __tablename__ = 'offline_order'
    order_id = Column(Integer, ForeignKey('order.order_id'), primary_key=True)
    order = relationship('Order', back_populates='offline_order', enable_typechecks=False, lazy=True, uselist=False,
                         cascade="all")

    employee_id = Column(Integer, ForeignKey('user.user_id'))
    employee = relationship("User", back_populates="offline_orders", foreign_keys=[employee_id])

    def to_dict(self):
        json = super().to_dict()
        json['order_type'] = {
            'id': 2,
            'name': ORDER_TYPE_TEXT[1],
            'detail': {
                'employee_name': self.employee.first_name + ' ' + self.employee.last_name
            }
        }
        return json


class OnlineOrder(Order):
    __tablename__ = 'online_order'
    order_id = Column(Integer, ForeignKey('order.order_id'), primary_key=True)
    shipping_method = Column(Enum(ShippingMethod))
    shipping_fee = Column(Double)
    note = Column(String)

    order_cancellation = relationship('OrderCancellation', backref='order', lazy=True, uselist=False)


    def to_dict(self):
        json = super().to_dict()
        json['order_type'] = {
            'id': 1,
            'name': ORDER_TYPE_TEXT[0],
            'detail': {
                'shipping_method': {
                    'id': self.shipping_method.value,
                    'name': SHIPPING_METHOD_TEXT[self.shipping_method.value - 1]
                },
                'shipping_fee': self.shipping_fee,
                'note': self.note
            }
        }
        if self.order_cancellation:
            json['order_type']['detail']['order_cancellation'] = self.order_cancellation.to_dict()
        return json

    def get_shipping_fee(self):
        return self.shipping_fee


class OrderCancellation(db.Model):
    __tablename__ = 'order_cancellation'
    order_id = Column(Integer, ForeignKey('online_order.order_id'), primary_key=True)
    created_at = Column(DATETIME, default=datetime.now())
    reason = Column(String)


    def to_dict(self):
        return {
            'reason': self.reason,
            'created_at': self.created_at
        }


class OrderDetail(db.Model):
    __tablename__ = 'order_detail'
    order_id = Column(Integer, ForeignKey('order.order_id'), primary_key=True)
    book_id = Column(Integer, ForeignKey('book.book_id'), primary_key=True)
    book = relationship("Book", back_populates="order_detail")
    quantity = Column(Integer)
    price = Column(Double)

    order = relationship("Order", back_populates='order_detail', enable_typechecks=False, lazy=True)

    def get_price(self):
        return self.price * self.quantity

    def to_dict(self):
        return {
            'quantity': self.quantity,
            'price': self.price,
            'book': self.book.to_dict()
        }


class PaymentDetail(db.Model):
    __tablename__ = 'payment_detail'
    payment_detail_id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DATETIME)
    amount = Column(Double)

    order_id = Column(Integer, ForeignKey('order.order_id'), unique=True)
    order = relationship("Order", back_populates="payment_detail", enable_typechecks=False, lazy=True)
    def to_dict(self):
        return {
            'amount': self.amount,
            'created_at': self.created_at
        }
