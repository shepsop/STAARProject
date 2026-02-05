"""
STAAR Test Prep - Flask Backend API
Handles user progress, questions, and scoring
"""
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime
import random
from azure.cosmos import CosmosClient, PartitionKey, exceptions as cosmos_exceptions
from azure.identity import DefaultAzureCredential

app = Flask(__name__, static_folder='../frontend/build', static_url_path='')
CORS(app)

# In-memory storage (fallback if Cosmos DB not configured)
users_data = {}
questions_data = None

# Cosmos DB (optional)
cosmos_client = None
cosmos_container = None
cosmos_enabled = False

def init_cosmos():
    """Initialize Cosmos DB if configured via environment variables."""
    global cosmos_client, cosmos_container, cosmos_enabled

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
        cosmos_enabled = True
        print("Cosmos DB enabled for user persistence")
    except Exception as exc:
        cosmos_enabled = False
        cosmos_client = None
        cosmos_container = None
        print(f"Cosmos DB not available, using in-memory storage: {exc}")

def default_user(user_id):
    return {
        "id": user_id,
        "user_id": user_id,
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
        "subjects_completed": {"math": 0, "reading": 0}
    }

def get_user_record(user_id):
    if cosmos_enabled and cosmos_container:
        try:
            return cosmos_container.read_item(item=user_id, partition_key=user_id)
        except cosmos_exceptions.CosmosResourceNotFoundError:
            return None
    return users_data.get(user_id)

def save_user_record(user):
    if cosmos_enabled and cosmos_container:
        cosmos_container.upsert_item(user)
    else:
        users_data[user["user_id"]] = user

def get_top_users(limit=10):
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
        from datetime import datetime as dt
        last_date = dt.fromisoformat(last_played_date).date()
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

# Load questions from JSON file
def load_questions():
    global questions_data
    questions_file = os.path.join(os.path.dirname(__file__), 'data', 'questions.json')
    if os.path.exists(questions_file):
        with open(questions_file, 'r') as f:
            questions_data = json.load(f)
    else:
        # Default questions if file doesn't exist
        questions_data = {
            "math": [],
            "reading": []
        }

@app.route('/')
def serve():
    """Serve the React frontend"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.utcnow().isoformat()})

@app.route('/api/user/<user_id>', methods=['GET'])
def get_user_progress(user_id):
    """Get user progress and stats"""
    user = get_user_record(user_id)
    if not user:
        user = default_user(user_id)
        save_user_record(user)
    return jsonify(user)

@app.route('/api/user/<user_id>/progress', methods=['POST'])
def update_user_progress(user_id):
    """Update user progress after completing a question or game"""
    data = request.json

    user = get_user_record(user_id)
    if not user:
        user = default_user(user_id)
    
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
    
    if data.get('correct'):
        user['correct_answers'] += 1
        points_earned = data.get('points', 10)
        user['total_points'] += points_earned + streak_bonus
        
        # Check for level up
        points_needed_for_next_level = user['current_level'] * 300
        if user['total_points'] >= points_needed_for_next_level:
            user['current_level'] += 1
            level_up = True
    
    # Check for new badges
    game_data = {
        'perfect_game': data.get('perfect_game', False)
    }
    new_badges = check_for_badges(user, game_data)
    
    # Add new badges to user's collection
    if new_badges:
        user['badges'].extend(new_badges)
    
    user['last_played'] = datetime.utcnow().isoformat()
    save_user_record(user)
    
    return jsonify({
        "user": user,
        "level_up": level_up,
        "new_badges": new_badges,
        "streak_bonus": streak_bonus,
        "streak_updated": streak_updated
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

# Catch-all route to serve React app for client-side routing
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

load_questions()
init_cosmos()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=True)
