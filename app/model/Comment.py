from app import db


class Comment(db.Model):
    comment_id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.now())
    star_count = db.Column(db.Integer)

    book_id = db.Column(db.Integer, db.ForeignKey('book.book_id'))
    book = db.relationship('Book', backref='comments', lazy=True)

    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'))
    user = db.relationship('User', backref='comments')

    def to_dict(self):
        return {
            'comment_id': self.comment_id,
            'content': self.content,
            'created_at': self.created_at,
            'star_count': self.star_count,
            'user_name': self.user.full_name
        }
