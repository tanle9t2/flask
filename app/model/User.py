from sqlalchemy import Column, Integer, String, Boolean, Text, Date, DateTime, Enum
from app import db, app
from sqlalchemy.orm import relationship
from enum import Enum as RoleEnum
from datetime import datetime
import hashlib
from app.model.Cart import Cart


from app.model.Address import Address


class UserRole(RoleEnum):
    ADMIN = 1
    USER = 2
    ANONYMOUS = 3


class User(db.Model):
    __tablename__ = 'user'
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    first_name = Column(String(20), nullable=False)
    last_name = Column(String(50), nullable=False)
    sex = Column(Boolean, nullable=False)
    email = Column(String(50), nullable=False, unique=True)
    phone_number = Column(String(10))
    date_of_birth = Column(Date)
    avt_url = Column(Text,
                     default="https://png.pngtree.com/png-vector/20191101/ourmid/pngtree-cartoon-color-simple-male-avatar-png-image_1934459.jpg")
    isActive = Column(Boolean, default=True)
    last_access = Column(DateTime, default=datetime.utcnow)
    user_role = Column(Enum(UserRole), default=UserRole.USER)
    address = relationship('Address', backref='user', lazy=True, cascade='all, delete-orphan')
    # order = relationship('Order', backref='user', lazy=True, foreign_keys='Order.user_id')

    offline_orders = relationship("OfflineOrder", back_populates="employee", foreign_keys="[OfflineOrder.employee_id]",
                                  lazy=True)
    orders = relationship("Order", back_populates="customer", enable_typechecks=False,
                          foreign_keys="[Order.customer_id]", lazy=True)
    # account = relationship('Account', back_populates='user', uselist=False)
    # online_orders = relationship("OnlineOrder", backref="customer", foreign_keys="[Order.customer_id]", lazy=True)
    form_import = relationship("FormImport", back_populates="employee", lazy=True)
    cart = relationship("Cart", back_populates="user")

    def test(self):
        return self.account

    def to_local_storge(self):
        return {
            "user_id": self.user_id,
        }

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def is_active(self):
        return self.isActive

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def get_id(self):
        return str(self.user_id)

# if __name__ == '__main__':
#     with app.app_context():
#         db.create_all()
#         u = User(first_name="Quan Tri", last_name="Vien", username="admin", password=str(hashlib.md5('admin'.encode('utf-8')).hexdigest()),email="admin@gmail.com",
#                  user_role=UserRole.ADMIN)
#         db.session.add(u)
#         db.session.commit()
