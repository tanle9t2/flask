from app import db


def create_payment(payment):
    db.session.add(payment)
    db.session.commit()
