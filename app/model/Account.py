from sqlalchemy import Column, Integer, String, Boolean, Text, Date, DateTime, Enum, ForeignKey
from app import db, app
from sqlalchemy.orm import relationship
from app.model.User import User
class Account(db.Model):
    __tablename__ = 'account'
    account_id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(120), nullable=False, unique=True)
    password = Column(String(120), nullable=False)
    user_id = Column(Integer, ForeignKey('user.user_id'), nullable=False, unique=True)

    user = relationship('User', backref='account',uselist=False)

    # offline_orders = relationship("OfflineOrder", back_populates="employee", lazy=True)
    # online_orders = relationship("OnlineOrder", back_populates="customer", lazy=True)
    # form_import = relationship("FormImport", back_populates="employee", lazy=True)
    # cart = relationship("Cart", back_populates="user")

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
        return str(self.account_id)
