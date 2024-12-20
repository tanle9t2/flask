from app import db


class Cart(db.Model):
    cart_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)

    cart_items = db.relationship('CartItem', back_populates='cart', lazy=False, cascade="all,delete-orphan")
    user = db.relationship('User', back_populates='cart', lazy=True)

    def to_dict(self):
        return {
            'cart_id': self.cart_id,
            'user_id': self.user_id,
            'cart_items': [cart_item.to_dict() for cart_item in self.cart_items],
        }

    def total_price(self):
        total = 0
        for cart_item in self.cart_items:
            total += cart_item.get_price()

        return total
