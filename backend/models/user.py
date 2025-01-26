from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from extensions.database import mongo

class User(UserMixin):
    def __init__(self, email, nickname=None, password=None):
        self.email = email
        self.nickname = nickname
        self.password_hash = generate_password_hash(password) if password else None

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

def get_user_by_id(user_id):
    db = mongo.get_db()
    user = db.users.find_one({"_id": user_id})
    if not user:
        return None
    return User(email=user['email'], nickname=user['nickname'])
