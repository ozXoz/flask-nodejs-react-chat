from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from extensions.database import mongo
from flask_jwt_extended import create_access_token

auth = Blueprint('auth', __name__)

@auth.route('/register', methods=['POST'])
def register():
    try:
        db = mongo.get_db()  # Access the database instance
        print(f"Debug: MongoDB database: {db}")

        # Parse request data
        data = request.get_json()
        email = data.get('email')
        nickname = data.get('nickname')
        password = data.get('password')
        re_password = data.get('re_password')

        # Validate required fields
        if not email or not nickname or not password or not re_password:
            return jsonify({'error': 'All fields are required'}), 400
        if password != re_password:
            return jsonify({'error': 'Passwords do not match'}), 400

        # Check if email already exists
        existing_user = db.users.find_one({'email': email})
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409

        # Insert user into the database
        db.users.insert_one({
            'email': email,
            'nickname': nickname,
            'password_hash': generate_password_hash(password)
        })

        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        print(f"Error during registration: {e}")
        return jsonify({'error': str(e)}), 500


@auth.route('/login', methods=['POST'])
def login():
    try:
        db = mongo.get_db()  # Access the database instance

        # Parse request data
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        # Fetch the user by email
        user = db.users.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401

        # Verify the password
        if not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401

        # Generate a JWT token
        access_token = create_access_token(identity={'email': user['email'], 'nickname': user['nickname']})

        # Successful login
        return jsonify({'message': 'Login successful!', 'access_token': access_token}), 200
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'error': str(e)}), 500


@auth.route('/debug-mongo', methods=['GET'])
def debug_mongo():
    try:
        print(f"Debug: mongo = {mongo}")
        print(f"Debug: mongo.db = {mongo.db}")
        return jsonify({"message": "MongoDB is initialized!"}), 200
    except Exception as e:
        print(f"Debug Error: {e}")
        return jsonify({"error": str(e)}), 500
