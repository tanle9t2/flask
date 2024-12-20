from app.model.Publisher import Publisher


def find_all():
    return Publisher.query.all()
