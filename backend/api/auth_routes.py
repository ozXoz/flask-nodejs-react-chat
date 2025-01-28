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
        db = mongo.get_db()

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
        return jsonify({
            'message': 'Login successful!',
            'access_token': access_token,
            'email': user['email'],        # Include email
            'nickname': user['nickname']  # Include nickname
        }), 200
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'error': str(e)}), 500


@auth.route('/users', methods=['GET'])
def search_users():
    try:
        db = mongo.get_db()
        query = request.args.get('q', '').strip()  # Get the search query
        users = list(db.users.find(
            {"$or": [{"nickname": {"$regex": query, "$options": "i"}}, {"email": {"$regex": query, "$options": "i"}}]},
            {"_id": 0, "email": 1, "nickname": 1}
        ))
        return jsonify(users), 200
    except Exception as e:
        print(f"Error during user search: {e}")
        return jsonify({'error': 'Unable to fetch users'}), 500


@auth.route('/messages', methods=['GET'])
def get_messages():
    try:
        db = mongo.get_db()
        email = request.args.get('email')  # Sender's email
        recipient = request.args.get('recipient')  # Recipient's nickname or email

        # Debug: Ensure parameters are received correctly
        print(f"[DEBUG] Fetching messages for: email={email}, recipient={recipient}")

        # Construct chatId
        chat_id = "_".join(sorted([email, recipient]))  # Consistent chatId generation

        # Fetch messages where the chatId matches
        conversations = list(db.messages.find(
            {"chatId": chat_id},
            {"_id": 0, "sender": 1, "recipient": 1, "message": 1, "timestamp": 1}
        ).sort("timestamp", 1))

        # Debug: Log the fetched messages
        print(f"[DEBUG] Messages fetched for chatId '{chat_id}': {conversations}")

        return jsonify(conversations), 200
    except Exception as e:
        print(f"[ERROR] Error fetching messages: {e}")
        return jsonify({'error': 'Unable to fetch messages'}), 500




@auth.route('/conversations', methods=['GET'])
def get_conversations():
    try:
        db = mongo.get_db()
        email = request.args.get('email')

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        # Fetch the last message for each conversation
        conversations = db.messages.aggregate([
            {"$match": {"$or": [{"email": email}, {"recipient": email}]}},
            {"$group": {
                "_id": {
                    "$cond": [{"$eq": ["$email", email]}, "$recipient", "$email"]
                },
                "lastMessage": {"$last": "$message"},
                "timestamp": {"$last": "$timestamp"}
            }},
            {"$project": {
                "_id": 0,
                "participant": "$_id",
                "lastMessage": 1,
                "timestamp": 1
            }},
            {"$sort": {"timestamp": -1}}
        ])

        result = list(conversations)
        print("Fetched conversations:", result)
        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching conversations: {e}")
        return jsonify({'error': 'Unable to fetch conversations'}), 500


@auth.route('/all_conversations', methods=['GET'])
def get_all_conversations():
    try:
        db = mongo.get_db()
        email = request.args.get('email')

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        # Fetch all messages grouped by chatId
        messages_by_chat = db.messages.aggregate([
            {"$match": {"$or": [{"sender": email}, {"recipient": email}]}},
            {"$group": {
                "_id": "$chatId",
                "messages": {"$push": {
                    "sender": "$sender",
                    "recipient": "$recipient",
                    "message": "$message",
                    "timestamp": "$timestamp"
                }}
            }},
            {"$project": {"_id": 0, "chatId": "$_id", "messages": 1}}
        ])

        result = list(messages_by_chat)
        print("[DEBUG] Fetched all conversations:", result)
        return jsonify(result), 200
    except Exception as e:
        print(f"[ERROR] Error fetching all conversations: {e}")
        return jsonify({'error': 'Unable to fetch conversations'}), 500





@auth.route('/chat/messages/<chat_id>', methods=['GET'])
def get_chat_messages(chat_id):
    try:
        db = mongo.get_db()

        # Fetch messages for the specified chatId
        messages = list(db.messages.find(
            {"chatId": chat_id},
            {"_id": 0, "sender": 1, "recipient": 1, "message": 1, "timestamp": 1}
        ).sort("timestamp", 1))

        # Debug: Log the fetched messages
        print(f"[DEBUG] Messages fetched for chatId '{chat_id}': {messages}")

        return jsonify(messages), 200
    except Exception as e:
        print(f"[ERROR] Error fetching messages for chatId '{chat_id}': {e}")
        return jsonify({'error': 'Unable to fetch messages'}), 500


@auth.route('/debug-mongo', methods=['GET'])
def debug_mongo():
    try:
        print(f"Debug: mongo = {mongo}")
        print(f"Debug: mongo.db = {mongo.db}")
        return jsonify({"message": "MongoDB is initialized!"}), 200
    except Exception as e:
        print(f"Debug Error: {e}")
        return jsonify({"error": str(e)}), 500
