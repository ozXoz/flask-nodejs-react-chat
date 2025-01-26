from pymongo import MongoClient
from flask import current_app

class MongoDB:
    def __init__(self):
        self.client = None
        self.db = None

    def init_app(self, app):
        mongo_uri = app.config.get('MONGO_URI')
        if not mongo_uri:
            raise ValueError("MONGO_URI is not set in configuration")

        # Initialize MongoDB client
        self.client = MongoClient(mongo_uri)
        db_name = mongo_uri.split('/')[-1].split('?')[0]  # Extract database name
        if not db_name:
            raise ValueError("Database name is missing in MONGO_URI")

        self.db = self.client[db_name]

    def get_db(self):
        if self.db is None:
            raise RuntimeError("MongoDB is not initialized. Call init_app first.")
        return self.db


# Create a global MongoDB instance
mongo = MongoDB()
