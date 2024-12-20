from app.model.Address import Address


def find_by_user_id(user_id):
    return Address.query.filter_by(user_id=user_id).all()
