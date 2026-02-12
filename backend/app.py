"""
STAAR Test Prep - Flask Backend API with Multi-User Authentication
Handles user registration, login, progress tracking, and scoring
"""
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime, timedelta
import random
import uuid
import bcrypt
import jwt
from functools import wraps
from azure.cosmos import CosmosClient, PartitionKey, exceptions as cosmos_exceptions
from azure.identity import DefaultAzureCredential

# Determine static folder path (works in both development and production)
if os.path.exists('../frontend/build'):
    static_folder = '../frontend/build'
elif os.path.exists('/app/frontend/build'):
    static_folder = '/app/frontend/build'
else:
    static_folder = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'build')

app = Flask(__name__, static_folder=static_folder, static_url_path='')
CORS(app)

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "staar-quest-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

# In-memory storage (fallback if Cosmos DB not configured)
users_data = {}
auth_users_data = {}  # Store authentication records
audit_logs = []  # Store admin actions
questions_data = None

# Cosmos DB (optional)
cosmos_client = None
cosmos_container = None
cosmos_users_container = None
cosmos_audit_container = None
cosmos_enabled = False


def init_cosmos():
    """Initialize Cosmos DB if configured via environment variables."""
    global cosmos_client, cosmos_container, cosmos_users_container, cosmos_audit_container, cosmos_enabled

    endpoint = os.getenv("COSMOS_ENDPOINT")
    if not endpoint:
        return

    database_name = os.getenv("COSMOS_DATABASE", "staar")
    container_name = os.getenv("COSMOS_CONTAINER", "users")
    key = os.getenv("COSMOS_KEY")

    try:
        if key:
            cosmos_client = CosmosClient(endpoint, key)
        else:
            credential = DefaultAzureCredential()
            cosmos_client = CosmosClient(endpoint, credential=credential)

        database = cosmos_client.create_database_if_not_exists(database_name)
        cosmos_container = database.create_container_if_not_exists(
            id=container_name,
            partition_key=PartitionKey(path="/user_id")
        )
        cosmos_users_container = database.create_container_if_not_exists(
            id="auth_users",
            partition_key=PartitionKey(path="/username")
        )
        cosmos_audit_container = database.create_container_if_not_exists(
            id="audit_logs",
            partition_key=PartitionKey(path="/admin_user_id")
        )
        cosmos_enabled = True
        print("✓ Cosmos DB enabled for user persistence")
    except Exception as exc:
        cosmos_enabled = False
        cosmos_client = None
        cosmos_container = None
        cosmos_users_container = None
        cosmos_audit_container = None
        print(f"⚠ Cosmos DB not available, using in-memory storage: {exc}")


def hash_password(password):
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password, hashed):
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def generate_token(user_id):
    """Generate JWT token"""
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_token(token):
    """Verify JWT token and return user_id"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401

        return f(user_id, *args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        user_id = verify_token(token)
        if not user_id:
            return jsonify({'error': 'Invalid or expired token'}), 401

        # Check if user is admin
        user_auth = get_auth_user_by_id(user_id)
        if not user_auth or not user_auth.get('is_admin', False):
            return jsonify({'error': 'Admin privileges required'}), 403

        return f(user_id, *args, **kwargs)
    return decorated


def get_auth_user_by_id(user_id):
    """Get authentication record by user_id"""
    if cosmos_enabled and cosmos_users_container:
        try:
            items = list(cosmos_users_container.query_items(
                query="SELECT * FROM c WHERE c.user_id = @user_id",
                parameters=[{"name": "@user_id", "value": user_id}],
                enable_cross_partition_query=True
            ))
            return items[0] if items else None
        except Exception:
            return None
    # Fallback to in-memory storage
    for auth_user in auth_users_data.values():
        if auth_user.get('user_id') == user_id:
            return auth_user
    return None


def log_admin_action(admin_user_id, action, target_user, details):
    """Log an admin action for audit purposes"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "admin_user_id": admin_user_id,
        "action": action,
        "target_user": target_user,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
    if cosmos_enabled and cosmos_audit_container:
        cosmos_audit_container.upsert_item(log_entry)
    else:
        audit_logs.append(log_entry)
    return log_entry


def generate_temp_password():
    """Generate a temporary password"""
    import string
    chars = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(chars) for _ in range(12))


def default_user(user_id, username=None):
    """Create default user record"""
    return {
        "id": user_id,
        "user_id": user_id,
        "username": username or user_id,
        "total_points": 0,
        "current_level": 1,
        "streak_days": 0,
        "longest_streak": 0,
        "questions_answered": 0,
        "correct_answers": 0,
        "badges": [],
        "last_played": None,
        "last_played_date": None,
        "perfect_games": 0,
        "subjects_completed": {"math": 0, "reading": 0},
        "current_combo": 0,
        "max_combo": 0,
        "daily_challenges": {},
        "mystery_boxes_opened": 0,
        "created_at": datetime.utcnow().isoformat()
    }


def get_auth_user(username):
    """Get authentication record for a user"""
    if cosmos_enabled and cosmos_users_container:
        try:
            return cosmos_users_container.read_item(item=username, partition_key=username)
        except cosmos_exceptions.CosmosResourceNotFoundError:
            return None
    # Fallback to in-memory storage
    return auth_users_data.get(username)


def save_auth_user(username, password_hash, user_id, is_admin=False):
    """Save authentication record"""
    auth_record = {
        "id": username,
        "username": username,
        "password_hash": password_hash,
        "user_id": user_id,
        "is_admin": is_admin,
        "created_at": datetime.utcnow().isoformat()
    }
    if cosmos_enabled and cosmos_users_container:
        cosmos_users_container.upsert_item(auth_record)
    else:
        # Fallback to in-memory storage
        auth_users_data[username] = auth_record
    return auth_record


def get_user_record(user_id):
    """Get user progress record"""
    if cosmos_enabled and cosmos_container:
        try:
            return cosmos_container.read_item(item=user_id, partition_key=user_id)
        except cosmos_exceptions.CosmosResourceNotFoundError:
            return None
    return users_data.get(user_id)


def save_user_record(user):
    """Save user progress record"""
    if cosmos_enabled and cosmos_container:
        cosmos_container.upsert_item(user)
    else:
        users_data[user["user_id"]] = user


def get_top_users(limit=10):
    """Get top users by points"""
    if cosmos_enabled and cosmos_container:
        query = "SELECT TOP @limit * FROM c ORDER BY c.total_points DESC"
        items = cosmos_container.query_items(
            query=query,
            parameters=[{"name": "@limit", "value": limit}],
            enable_cross_partition_query=True
        )
        return list(items)
    sorted_users = sorted(users_data.values(), key=lambda x: x['total_points'], reverse=True)
    return sorted_users[:limit]


def check_for_badges(user, game_data=None):
    """Check and award badges based on user achievements"""
    new_badges = []
    
    # First Win Badge
    if user['questions_answered'] == 1 and user['correct_answers'] == 1:
        new_badges.append({
            "id": "first_win",
            "name": "First Victory",
            "description": "Answer your first question correctly!",
            "icon": "🎯",
            "earned_at": datetime.utcnow().isoformat()
        })
    
    # Milestone Badges
    milestones = [
        (10, "novice", "Novice Explorer", "Complete 10 questions", "📚"),
        (50, "apprentice", "Apprentice Scholar", "Complete 50 questions", "📖"),
        (100, "expert", "Expert Learner", "Complete 100 questions", "🎓"),
        (250, "master", "Master Student", "Complete 250 questions", "🏆"),
        (500, "legend", "Legendary Scholar", "Complete 500 questions", "👑")
    ]
    
    for count, badge_id, name, desc, icon in milestones:
        if user['questions_answered'] == count:
            if not any(b.get('id') == badge_id for b in user['badges']):
                new_badges.append({
                    "id": badge_id,
                    "name": name,
                    "description": desc,
                    "icon": icon,
                    "earned_at": datetime.utcnow().isoformat()
                })
    
    # Accuracy Badges
    if user['questions_answered'] >= 10:
        accuracy = (user['correct_answers'] / user['questions_answered']) * 100
        if accuracy >= 90 and not any(b.get('id') == 'sharpshooter' for b in user['badges']):
            new_badges.append({
                "id": "sharpshooter",
                "name": "Sharp Shooter",
                "description": "Maintain 90%+ accuracy over 10+ questions",
                "icon": "🎯",
                "earned_at": datetime.utcnow().isoformat()
            })
    
    # Perfect Game Badge
    if game_data and game_data.get('perfect_game'):
        user['perfect_games'] = user.get('perfect_games', 0) + 1
        new_badges.append({
            "id": f"perfect_{user['perfect_games']}",
            "name": "Perfect Game!",
            "description": "100% accuracy in a game!",
            "icon": "💯",
            "earned_at": datetime.utcnow().isoformat()
        })
    
    # Streak Badges
    streak_milestones = [
        (3, "streak_3", "3-Day Streak", "Play 3 days in a row", "🔥"),
        (7, "streak_7", "Week Warrior", "Play 7 days in a row", "⚡"),
        (14, "streak_14", "Two Week Champion", "Play 14 days in a row", "💪"),
        (30, "streak_30", "Month Master", "Play 30 days in a row", "🌟")
    ]
    
    for days, badge_id, name, desc, icon in streak_milestones:
        if user['streak_days'] == days:
            if not any(b.get('id') == badge_id for b in user['badges']):
                new_badges.append({
                    "id": badge_id,
                    "name": name,
                    "description": desc,
                    "icon": icon,
                    "earned_at": datetime.utcnow().isoformat()
                })
    
    # Subject-specific badges
    for subject in ['math', 'reading']:
        subject_count = user.get('subjects_completed', {}).get(subject, 0)
        if subject_count == 10:
            badge_id = f"{subject}_starter"
            if not any(b.get('id') == badge_id for b in user['badges']):
                icons = {"math": "🔢", "reading": "📖"}
                new_badges.append({
                    "id": badge_id,
                    "name": f"{subject.title()} Starter",
                    "description": f"Complete 10 {subject} games",
                    "icon": icons[subject],
                    "earned_at": datetime.utcnow().isoformat()
                })
        elif subject_count == 25:
            badge_id = f"{subject}_master"
            if not any(b.get('id') == badge_id for b in user['badges']):
                icons = {"math": "🧮", "reading": "📚"}
                new_badges.append({
                    "id": badge_id,
                    "name": f"{subject.title()} Master",
                    "description": f"Complete 25 {subject} games",
                    "icon": icons[subject],
                    "earned_at": datetime.utcnow().isoformat()
                })
    
    return new_badges


def update_streak(user):
    """Update user's daily streak"""
    now = datetime.utcnow()
    today = now.date().isoformat()
    
    last_played_date = user.get('last_played_date')
    
    if last_played_date:
        last_date = datetime.fromisoformat(last_played_date).date()
        current_date = now.date()
        days_diff = (current_date - last_date).days
        
        if days_diff == 0:
            # Already played today, no streak change
            return user['streak_days'], False
        elif days_diff == 1:
            # Consecutive day - increase streak
            user['streak_days'] += 1
            user['longest_streak'] = max(user.get('longest_streak', 0), user['streak_days'])
            streak_bonus = user['streak_days'] * 10  # Bonus points for streak
            return streak_bonus, True
        else:
            # Streak broken
            user['streak_days'] = 1
            return 0, True
    else:
        # First time playing
        user['streak_days'] = 1
        return 0, True
    
    user['last_played_date'] = today
    return 0, False


def generate_daily_challenges():
    """Generate daily challenges for a user"""
    challenges = [
        {
            "id": "answer_5",
            "title": "Answer 5 questions correctly",
            "description": "Get 5 correct answers today",
            "goal": 5,
            "progress": 0,
            "reward": 50,
            "icon": "🎯",
            "type": "correct_answers"
        },
        {
            "id": "play_2_subjects",
            "title": "Try 2 different subjects",
            "description": "Play both Math and Reading today",
            "goal": 2,
            "progress": 0,
            "reward": 40,
            "icon": "📚",
            "type": "subjects_played"
        },
        {
            "id": "achieve_80_accuracy",
            "title": "Achieve 80% accuracy",
            "description": "Get 80% or more correct in a game",
            "goal": 80,
            "progress": 0,
            "reward": 60,
            "icon": "🎖️",
            "type": "accuracy"
        }
    ]
    return challenges


def get_daily_challenges(user):
    """Get or create daily challenges for the user"""
    today = datetime.utcnow().date().isoformat()
    
    if 'daily_challenges' not in user:
        user['daily_challenges'] = {}
    
    # Check if challenges need to be refreshed
    if user['daily_challenges'].get('date') != today:
        user['daily_challenges'] = {
            'date': today,
            'challenges': generate_daily_challenges(),
            'subjects_today': []
        }
    
    return user['daily_challenges']


def update_daily_challenges(user, correct_count, total_questions, subjects_played):
    """Update daily challenge progress and award rewards"""
    challenges_data = get_daily_challenges(user)
    challenges = challenges_data['challenges']
    rewards_earned = 0
    completed_challenges = []
    
    for challenge in challenges:
        if challenge.get('completed'):
            continue
            
        if challenge['type'] == 'correct_answers':
            challenge['progress'] = min(challenge['progress'] + (1 if correct_count > 0 else 0), challenge['goal'])
        elif challenge['type'] == 'subjects_played':
            if subjects_played:
                for subject in subjects_played:
                    if subject not in challenges_data.get('subjects_today', []):
                        challenges_data.setdefault('subjects_today', []).append(subject)
                challenge['progress'] = len(challenges_data.get('subjects_today', []))
        elif challenge['type'] == 'accuracy' and total_questions > 0:
            accuracy = (correct_count / total_questions) * 100
            if accuracy >= challenge['goal']:
                challenge['progress'] = challenge['goal']
        
        # Check if challenge is completed
        if challenge['progress'] >= challenge['goal'] and not challenge.get('completed'):
            challenge['completed'] = True
            challenge['completed_at'] = datetime.utcnow().isoformat()
            rewards_earned += challenge['reward']
            completed_challenges.append(challenge)
    
    return rewards_earned, completed_challenges


def calculate_combo_multiplier(combo_count):
    """Calculate point multiplier based on combo"""
    if combo_count >= 5:
        return 3.0
    elif combo_count >= 3:
        return 2.0
    elif combo_count >= 2:
        return 1.5
    return 1.0


def generate_mystery_box():
    """Generate a random mystery box reward"""
    boxes = [
        {"type": "points", "amount": 25, "message": "Found 25 bonus points!", "icon": "⭐"},
        {"type": "points", "amount": 50, "message": "Wow! 50 bonus points!", "icon": "💎"},
        {"type": "points", "amount": 100, "message": "JACKPOT! 100 bonus points!", "icon": "🎰", "rarity": 0.1},
        {"type": "badge", "name": "Lucky Star", "description": "Found in a mystery box!", "icon": "🍀"},
        {"type": "message", "message": "You're doing amazing! Keep it up!", "icon": "🌟"},
        {"type": "message", "message": "You're a superstar! Keep learning!", "icon": "✨"},
    ]
    
    # Weight rare items
    weighted_boxes = []
    for box in boxes:
        rarity = box.get('rarity', 0.3)
        if random.random() < rarity:
            weighted_boxes.append(box)
    
    if not weighted_boxes:
        weighted_boxes = [b for b in boxes if b.get('type') != 'badge']
    
    return random.choice(weighted_boxes) if weighted_boxes else boxes[0]


def load_questions():
    """Load questions from JSON file"""
    global questions_data
    questions_file = os.path.join(os.path.dirname(__file__), 'data', 'questions.json')
    if os.path.exists(questions_file):
        with open(questions_file, 'r') as f:
            questions_data = json.load(f)
    else:
        questions_data = {"math": [], "reading": []}


# ============ API ROUTES ============

@app.route('/')
def serve():
    """Serve the React frontend"""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "cosmosEnabled": cosmos_enabled
    })


@app.route('/api/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.json
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')
    
    # Validation
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    
    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400
    
    # Check if user already exists
    existing = get_auth_user(username)
    if existing:
        return jsonify({'error': 'Username already exists'}), 409
    
    # Create new user
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    
    # Save auth record and user progress record
    save_auth_user(username, password_hash, user_id)
    user_progress = default_user(user_id, username)
    save_user_record(user_progress)
    
    # Generate token
    token = generate_token(user_id)
    
    return jsonify({
        'message': 'User registered successfully',
        'token': token,
        'user_id': user_id,
        'username': username
    }), 201


@app.route('/api/login', methods=['POST'])
def login():
    """Login a user"""
    data = request.json
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Get auth record
    auth_user = get_auth_user(username)
    if not auth_user or not verify_password(password, auth_user['password_hash']):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    user_id = auth_user['user_id']
    token = generate_token(user_id)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user_id': user_id,
        'username': username
    }), 200


@app.route('/api/user/<user_id>', methods=['GET'])
@token_required
def get_user_progress(authenticated_user_id, user_id):
    """Get user progress and stats"""
    # Only allow users to access their own data
    if authenticated_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    user = get_user_record(user_id)
    if not user:
        user = default_user(user_id)
        save_user_record(user)
    
    # Ensure daily challenges are current
    get_daily_challenges(user)
    save_user_record(user)
    
    return jsonify(user)


@app.route('/api/user/<user_id>/progress', methods=['POST'])
@token_required
def update_user_progress(authenticated_user_id, user_id):
    """Update user progress after completing a question or game"""
    # Only allow users to update their own data
    if authenticated_user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json

    user = get_user_record(user_id)
    if not user:
        user = default_user(user_id)
    
    # Initialize new fields if not present
    if 'current_combo' not in user:
        user['current_combo'] = 0
    if 'max_combo' not in user:
        user['max_combo'] = 0
    if 'daily_challenges' not in user:
        user['daily_challenges'] = {}
    
    # Update streak
    streak_bonus, streak_updated = update_streak(user)
    
    # Track subject completion
    subject = data.get('subject', '')
    if subject and data.get('game_completed'):
        if 'subjects_completed' not in user:
            user['subjects_completed'] = {"math": 0, "reading": 0}
        user['subjects_completed'][subject] = user['subjects_completed'].get(subject, 0) + 1
    
    # Update stats
    user['questions_answered'] += 1
    level_up = False
    new_badges = []
    combo_bonus = 0
    combo_multiplier = 1.0
    mystery_box = None
    challenge_rewards = 0
    completed_challenges = []
    
    if data.get('correct'):
        user['correct_answers'] += 1
        
        # Update combo
        user['current_combo'] += 1
        user['max_combo'] = max(user.get('max_combo', 0), user['current_combo'])
        
        # Calculate combo multiplier
        combo_multiplier = calculate_combo_multiplier(user['current_combo'])
        
        # Calculate points with combo multiplier
        base_points = data.get('points', 10)
        combo_bonus = int(base_points * (combo_multiplier - 1))
        points_earned = base_points + combo_bonus
        
        user['total_points'] += points_earned + streak_bonus
        
        # Check for level up
        points_needed_for_next_level = user['current_level'] * 300
        if user['total_points'] >= points_needed_for_next_level:
            user['current_level'] += 1
            level_up = True
    else:
        # Wrong answer - reset combo
        user['current_combo'] = 0
    
    # Update daily challenges (if game completed)
    if data.get('game_completed'):
        correct_in_game = data.get('correct_count', 0)
        total_in_game = data.get('total_questions', 5)
        subjects_played = [subject] if subject else []
        
        challenge_rewards, completed_challenges = update_daily_challenges(
            user, correct_in_game, total_in_game, subjects_played
        )
        
        if challenge_rewards > 0:
            user['total_points'] += challenge_rewards
        
        # Mystery box chance on game completion (70% chance)
        if random.random() < 0.7:
            mystery_box = generate_mystery_box()
            
            if mystery_box['type'] == 'points':
                user['total_points'] += mystery_box['amount']
            elif mystery_box['type'] == 'badge':
                badge = {
                    "id": f"mystery_{user.get('mystery_boxes_opened', 0)}",
                    "name": mystery_box['name'],
                    "description": mystery_box['description'],
                    "icon": mystery_box['icon'],
                    "earned_at": datetime.utcnow().isoformat()
                }
                user['badges'].append(badge)
                new_badges.append(badge)
            
            user['mystery_boxes_opened'] = user.get('mystery_boxes_opened', 0) + 1
    
    # Check for new badges
    game_data = {'perfect_game': data.get('perfect_game', False)}
    achievement_badges = check_for_badges(user, game_data)
    
    # Add combo badges
    if user['current_combo'] == 5:
        achievement_badges.append({
            "id": f"combo_5_{datetime.utcnow().timestamp()}",
            "name": "Combo Master!",
            "description": "5 correct answers in a row!",
            "icon": "🔥",
            "earned_at": datetime.utcnow().isoformat()
        })
    elif user['current_combo'] == 10:
        achievement_badges.append({
            "id": f"combo_10_{datetime.utcnow().timestamp()}",
            "name": "Unstoppable!",
            "description": "10 correct answers in a row!",
            "icon": "⚡",
            "earned_at": datetime.utcnow().isoformat()
        })
    
    # Add new badges to user's collection
    if achievement_badges:
        user['badges'].extend(achievement_badges)
        new_badges.extend(achievement_badges)
    
    user['last_played'] = datetime.utcnow().isoformat()
    user['last_played_date'] = datetime.utcnow().date().isoformat()
    save_user_record(user)
    
    return jsonify({
        "user": user,
        "level_up": level_up,
        "new_badges": new_badges,
        "streak_bonus": streak_bonus,
        "streak_updated": streak_updated,
        "combo": user['current_combo'],
        "combo_multiplier": combo_multiplier,
        "combo_bonus": combo_bonus,
        "mystery_box": mystery_box,
        "challenge_rewards": challenge_rewards,
        "completed_challenges": completed_challenges
    })


@app.route('/api/questions/<subject>', methods=['GET'])
def get_questions(subject):
    """Get questions for a specific subject"""
    level = int(request.args.get('level', 1))
    count = int(request.args.get('count', 5))
    
    if questions_data is None:
        load_questions()
    
    subject_questions = questions_data.get(subject.lower(), [])
    
    # Filter by level/difficulty
    filtered_questions = [q for q in subject_questions if q.get('level', 1) == level]
    
    # If not enough questions at this level, include nearby levels
    if len(filtered_questions) < count:
        filtered_questions = [q for q in subject_questions 
                             if abs(q.get('level', 1) - level) <= 1]
    
    # Randomly select questions
    selected = random.sample(filtered_questions, min(count, len(filtered_questions)))
    
    return jsonify(selected)


@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get top users by points"""
    return jsonify(get_top_users(10))


# ============ ADMIN ROUTES ============

@app.route('/api/admin/users', methods=['GET'])
@admin_required
def admin_list_users(admin_user_id):
    """List all users (admin only)"""
    limit = int(request.args.get('limit', 100))
    
    if cosmos_enabled and cosmos_container:
        try:
            query = "SELECT TOP @limit c.user_id, c.username, c.current_level, c.total_points, c.created_at FROM c ORDER BY c.created_at DESC"
            items = list(cosmos_container.query_items(
                query=query,
                parameters=[{"name": "@limit", "value": limit}],
                enable_cross_partition_query=True
            ))
            return jsonify(items)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    # Fallback to in-memory storage
    users_list = sorted(
        [{'user_id': u['user_id'], 'username': u['username'], 'current_level': u['current_level'], 
          'total_points': u['total_points'], 'created_at': u['created_at']} 
         for u in users_data.values()],
        key=lambda x: x['created_at'],
        reverse=True
    )
    return jsonify(users_list[:limit])


@app.route('/api/admin/user/<username>', methods=['GET'])
@admin_required
def admin_get_user(admin_user_id, username):
    """Get specific user details (admin only)"""
    auth_user = get_auth_user(username)
    if not auth_user:
        return jsonify({'error': 'User not found'}), 404
    
    user_id = auth_user.get('user_id')
    user_progress = get_user_record(user_id)
    
    return jsonify({
        'username': username,
        'user_id': user_id,
        'created_at': auth_user.get('created_at'),
        'is_admin': auth_user.get('is_admin', False),
        'progress': user_progress or default_user(user_id, username)
    })


@app.route('/api/admin/reset-password', methods=['POST'])
@admin_required
def admin_reset_password(admin_user_id):
    """Reset a user's password (admin only)"""
    data = request.json
    target_username = data.get('username', '').strip().lower()
    new_password = data.get('new_password', '')
    
    if not target_username or not new_password:
        return jsonify({'error': 'Username and new password are required'}), 400
    
    if len(new_password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400
    
    # Check if admin is resetting their own password (should use different endpoint)
    admin_user = get_auth_user_by_id(admin_user_id)
    if admin_user and admin_user.get('username') == target_username:
        return jsonify({'error': 'Use the change password endpoint for your own password'}), 400
    
    # Get target user
    auth_user = get_auth_user(target_username)
    if not auth_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Update password
    new_password_hash = hash_password(new_password)
    auth_user['password_hash'] = new_password_hash
    auth_user['last_password_reset'] = datetime.utcnow().isoformat()
    auth_user['reset_by_admin'] = admin_user_id
    
    # Save updated auth record
    if cosmos_enabled and cosmos_users_container:
        cosmos_users_container.upsert_item(auth_user)
    else:
        auth_users_data[target_username] = auth_user
    
    # Log the action
    log_admin_action(admin_user_id, 'password_reset', target_username, 
                     {'username': target_username, 'admin': admin_user.get('username') if admin_user else 'unknown'})
    
    return jsonify({
        'message': f'Password reset successfully for user {target_username}',
        'username': target_username
    }), 200


@app.route('/api/admin/make-admin', methods=['POST'])
@admin_required
def admin_grant_privileges(admin_user_id):
    """Grant admin privileges to a user (admin only)"""
    # Check if requester is actually a super admin (optional - for now all admins can grant)
    data = request.json
    target_username = data.get('username', '').strip().lower()
    
    if not target_username:
        return jsonify({'error': 'Username is required'}), 400
    
    auth_user = get_auth_user(target_username)
    if not auth_user:
        return jsonify({'error': 'User not found'}), 404
    
    if auth_user.get('is_admin', False):
        return jsonify({'message': 'User is already an admin'}), 200
    
    # Grant admin privileges
    auth_user['is_admin'] = True
    auth_user['made_admin_at'] = datetime.utcnow().isoformat()
    auth_user['made_admin_by'] = admin_user_id
    
    if cosmos_enabled and cosmos_users_container:
        cosmos_users_container.upsert_item(auth_user)
    else:
        auth_users_data[target_username] = auth_user
    
    # Log the action
    admin_user = get_auth_user_by_id(admin_user_id)
    log_admin_action(admin_user_id, 'grant_admin', target_username,
                     {'username': target_username, 'granted_by': admin_user.get('username') if admin_user else 'unknown'})
    
    return jsonify({
        'message': f'Admin privileges granted to {target_username}',
        'username': target_username,
        'is_admin': True
    }), 200


@app.route('/api/admin/audit-logs', methods=['GET'])
@admin_required
def admin_get_audit_logs(admin_user_id):
    """Get audit logs of admin actions (admin only)"""
    limit = int(request.args.get('limit', 50))
    
    if cosmos_enabled and cosmos_audit_container:
        try:
            query = "SELECT TOP @limit * FROM c ORDER BY c.timestamp DESC"
            items = list(cosmos_audit_container.query_items(
                query=query,
                parameters=[{"name": "@limit", "value": limit}],
                enable_cross_partition_query=True
            ))
            return jsonify(items)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    # Fallback to in-memory storage
    sorted_logs = sorted(audit_logs, key=lambda x: x['timestamp'], reverse=True)
    return jsonify(sorted_logs[:limit])


@app.route('/api/admin/check', methods=['GET'])
@token_required
def check_admin_status(user_id):
    """Check if current user is an admin"""
    auth_user = get_auth_user_by_id(user_id)
    is_admin = auth_user.get('is_admin', False) if auth_user else False
    username = auth_user.get('username') if auth_user else None
    
    return jsonify({
        'is_admin': is_admin,
        'user_id': user_id,
        'username': username
    })


# Catch-all route to serve React app for client-side routing
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # Serve static files if they exist
    if path and '.' in path:
        file_path = os.path.join(app.static_folder, path)
        if os.path.exists(file_path):
            return send_from_directory(app.static_folder, path)
    
    # For all other paths (including /admin), serve index.html for client-side routing
    return send_from_directory(app.static_folder, 'index.html')


# Handle 404 errors by serving React app (fallback for client-side routing)
@app.errorhandler(404)
def not_found(e):
    # If it's an API request, return JSON error
    if request.path.startswith('/api/'):
        return jsonify(error='Not found'), 404
    # Otherwise, serve the React app
    return send_from_directory(app.static_folder, 'index.html')


# Initialize app
load_questions()
init_cosmos()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
