from sqlalchemy import Integer, ForeignKey

from app import db


class Attribute(db.Model):
    attribute_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    attribute_name = db.Column(db.String(50), unique=True, nullable=False)
    book_gerne_id = db.Column(Integer, ForeignKey('book_gerne.book_gerne_id'))

    extended_books = db.relationship('ExtendedBook', back_populates='attribute', lazy=True)

    def to_dict(self):
        return {
            'attribute_id': self.attribute_id,
            'attribute_name': self.attribute_name,
            'book_gerne_id': self.book_gerne_id,
        }

    def to_dto(self):
        return {
            'attribute_id': self.attribute_id,
            'attribute_name': self.attribute_name
        }
