from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from extensions.database import mongo
from flask_jwt_extended import create_access_token

auth = Blueprint('auth', __name__)

@auth.route('/register', methods=['POST']) 
def register():
    try:
        db = mongo.get_db()
        print(f"Debug: MongoDB database: {db}")

        data = request.get_json()
        email = data.get('email')
        nickname = data.get('nickname')
        password = data.get('password')
        re_password = data.get('re_password')

        if not email or not nickname or not password or not re_password:
            return jsonify({'error': 'All fields are required'}), 400
        if password != re_password:
            return jsonify({'error': 'Passwords do not match'}), 400

        existing_user = db.users.find_one({'email': email})
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409

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

        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = db.users.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401

        if not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Invalid credentials'}), 401

        access_token = create_access_token(
            identity={'email': user['email'], 'nickname': user['nickname']}
        )

        # <<<<< KEY CHANGE: return user['avatarUrl'] if present >>>>>
        avatar_url = user.get('avatarUrl', './avatar.png')  # or any default


        return jsonify({
            'message': 'Login successful!',
            'access_token': access_token,
            'email': user['email'],
            'nickname': user['nickname'],
            'avatarUrl': avatar_url  # <<<<< ADDED
        }), 200
    except Exception as e:
        print(f"Error during login: {e}")
        return jsonify({'error': str(e)}), 500


@auth.route('/users', methods=['GET'])
def search_users():
    try:
        db = mongo.get_db()
        query = request.args.get('q', '').strip()
        users = list(db.users.find(
            {"$or": [
                {"nickname": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}}
            ]},
            {"_id": 0, "email": 1, "nickname": 1}
        ))
        return jsonify(users), 200
    except Exception as e:
        print(f"Error during user search: {e}")
        return jsonify({'error': 'Unable to fetch users'}), 500

@auth.route('/conversations', methods=['GET'])
def get_conversations():
    """
    Returns the last message of each conversation for the logged-in user's email.
    """
    try:
        db = mongo.get_db()
        email = request.args.get('email')

        if not email:
            return jsonify({'error': 'Email is required'}), 400

        # <<<<< KEY CHANGE >>>>>
        # Use 'sender' or 'recipient' instead of 'email' to match messages
        conversations = db.messages.aggregate([
            {
                "$match": {
                    "$or": [
                        {"sender": email},
                        {"recipient": email}
                    ]
                }
            },
            {
                "$group": {
                    "_id": {
                        # if the sender is me, group by the recipient
                        "$cond": [
                            {"$eq": ["$sender", email]},
                            "$recipient",
                            "$sender"
                        ]
                    },
                    "lastMessage": {"$last": "$message"},
                    "timestamp": {"$last": "$timestamp"}
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "participant": "$_id",
                    "lastMessage": 1,
                    "timestamp": 1
                }
            },
            {"$sort": {"timestamp": -1}}
        ])

        result = list(conversations)
        print("Fetched conversations:", result)
        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching conversations: {e}")
        return jsonify({'error': 'Unable to fetch conversations'}), 500


@auth.route('/chat/messages/<chat_id>', methods=['GET'])
def get_chat_messages(chat_id):
    """
    Returns all messages for a specific chatId in ascending order.
    """
    try:
        db = mongo.get_db()
        messages = list(db.messages.find(
            {"chatId": chat_id},
            {"_id": 0, "sender": 1, "recipient": 1, "message": 1, "file": 1, "timestamp": 1}
        ).sort("timestamp", 1))

        print(f"[DEBUG] Messages fetched for chatId '{chat_id}': {messages}")
        return jsonify(messages), 200
    except Exception as e:
        print(f"[ERROR] Error fetching messages for chatId '{chat_id}': {e}")
        return jsonify({'error': 'Unable to fetch messages'}), 500


@auth.route('/debug-mongo', methods=['GET'])
def debug_mongo():
    try:
        from extensions.database import mongo
        print(f"Debug: mongo = {mongo}")
        print(f"Debug: mongo.db = {mongo.db}")
        return jsonify({"message": "MongoDB is initialized!"}), 200
    except Exception as e:
        print(f"Debug Error: {e}")
        return jsonify({"error": str(e)}), 500


@auth.route('/user', methods=['GET'])
def get_user_info():
    """
    Returns a single user's avatarUrl (and possibly other fields)
    so other users can see the updated avatar in conversation lists.
    """
    try:
        db = mongo.get_db()
        email = request.args.get('email')
        if not email:
            return jsonify({'error': 'Email is required'}), 400

        user = db.users.find_one({'email': email}, {'_id': 0, 'avatarUrl': 1, 'nickname': 1})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # user might look like {"avatarUrl": "...", "nickname": "..."}
        # if avatarUrl is missing, fallback
        if 'avatarUrl' not in user:
            user['avatarUrl'] = './avatar.png'
        return jsonify(user), 200
    except Exception as e:
        print(f"Error fetching user info: {e}")
        return jsonify({'error': 'Unable to fetch user info'}), 500
