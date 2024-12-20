from app import db
from app.model.Attribute import Attribute


class BookGerne(db.Model):
    __tablename__ = 'book_gerne'
    book_gerne_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String)
    lft = db.Column(db.Integer)
    rgt = db.Column(db.Integer)
    # books = db.relationship('Book', backref='book_gerne', lazy=True)
    books = db.relationship('Book', back_populates='book_gerne', lazy=True)
    attributes = db.relationship('Attribute', backref='book_gerne', lazy=True)

    def __init__(self, book_type_id, name, description, lft, rgt):
        self.book_type_id = book_type_id
        self.name = name
        self.description = description
        self.lft = lft
        self.rgt = rgt

    def to_dict(self):
        return {
            'book_type_id': self.book_gerne_id,
            'name': self.name,
            'lft': self.lft,
            'rgt': self.rgt,
            'attributes': [attriubte.to_dict() for attriubte in self.attributes]
        }

    def to_dto(self):
        return {
            'book_gerne_id': self.book_gerne_id,
            'name': self.name,
            'lft': self.lft,
            'rgt': self.rgt,
        }
