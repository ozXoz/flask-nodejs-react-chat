from flask import Flask, jsonify
from flask_login import LoginManager
from dotenv import load_dotenv
import os
from extensions.database import mongo
from flask_jwt_extended import JWTManager
from flask_cors import CORS  # Import CORS

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Load configurations
app.config['MONGO_URI'] = os.getenv('MONGO_URI')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback_secret_key')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')

# Allow CORS
CORS(app, supports_credentials=True, resources={r"/*": {
    "origins": [
        "http://127.0.0.1:5173",
        "http://localhost:5173"
    ],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})


# Initialize extensions
login_manager = LoginManager()
jwt = JWTManager()

mongo.init_app(app)
login_manager.init_app(app)
jwt.init_app(app)

# Debugging MongoDB initialization
print(f"Debug: Connected to MongoDB database: {mongo.get_db()}")

# Register blueprints
from api.auth_routes import auth
app.register_blueprint(auth, url_prefix='/auth')

# ✅ Add a basic route to confirm deployment
@app.route('/')
def home():
    return jsonify({"message": "Welcome to the backend of Flask!"})

# ✅ This ensures Vercel can recognize `app`
if __name__ == "__main__":
    app.run(debug=True)
