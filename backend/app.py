from flask import Flask
from flask_login import LoginManager
from dotenv import load_dotenv
import os
from extensions.database import mongo
from flask_jwt_extended import JWTManager

# Load environment variables
load_dotenv()

# Initialize Flask extensions
login_manager = LoginManager()
# Initialize JWTManager
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # Load configurations
    app.config['MONGO_URI'] = os.getenv('MONGO_URI')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback_secret_key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')  # Add JWT secret

    # Initialize extensions
    mongo.init_app(app)  # Initialize MongoDB
    login_manager.init_app(app)
    jwt.init_app(app)  # Initialize JWT with the app

    # Debugging MongoDB initialization
    print(f"Debug: Connected to MongoDB database: {mongo.get_db()}")

    # Register blueprints
    from api.auth_routes import auth
    app.register_blueprint(auth, url_prefix='/auth')

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
