import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    MONGO_URI = os.getenv('MONGO_URI')


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    MONGO_URI = os.getenv('MONGO_TEST_URI')


class ProductionConfig(Config):
    DEBUG = False
