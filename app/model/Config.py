from app import db

class Config(db.Model):
    __tablename__='config'
    min_restock_qty = db.Column(db.Integer, primary_key=True) #So luong nhap toi thieu
    min_restock_level = db.Column(db.Integer, primary_key=True) #So luong ton toi thieu truoc khi nhap
    order_cancel_period = db.Column(db.Integer, primary_key=True)

    def to_dict(self):
        return {
            'min_restock_qty': self.min_restock_qty,
            'min_restock_level': self.min_restock_level,
            'order_cancel_period': self.order_cancel_period
        }