from app.model.Config import Config


def get_config():
    return Config.query.first()