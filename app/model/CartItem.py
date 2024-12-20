from app import db
from app.model.Cart import Cart

class CartItem(db.Model):
    __tablename__ = 'cart_item'
    cart_id = db.Column(db.Integer, db.ForeignKey('cart.cart_id'), primary_key=True)
    book_id = db.Column(db.Integer, db.ForeignKey('book.book_id'), primary_key=True)

    quantity = db.Column(db.Integer, nullable=False)
    book = db.relationship('Book', back_populates='cart_item')
    cart = db.relationship('Cart', back_populates='cart_items')

    def to_dict(self):
        return {
            'cart_id': self.cart_id,
            'book': {
                "bookId": self.book_id,
                "title": self.book.title,
                "price": self.book.price,
                "remainBook": self.book.quantity,
                "poster": self.book.images[0].image_url
            },
            "quantity": self.quantity,
        }

    def get_price(self):
        return self.book.price * self.quantity

    def increase_quantity(self, quantity):
        if quantity > self.book.quantity: return False
        self.quantity += quantity

    def decrease_quantity(self, quantity):
        if quantity < 0: return False
        self.quantity -= quantity
