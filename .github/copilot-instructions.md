# STAAR Quest - 4th Grade Test Prep Web App

## Project Overview
An engaging, gamified web application for 4th grade STAAR test preparation in Texas. Features colorful UI, animations, points system, and progressive levels to make learning fun!

## Tech Stack
- **Frontend**: React 18 with Framer Motion animations
- **Backend**: Python Flask API
- **Database**: Azure Cosmos DB (optional - currently using in-memory storage)
- **Deployment**: Azure App Service with Docker
- **Styling**: Custom CSS with responsive design for iPad and desktop

## Key Features
✅ Level-based progression (5 levels per subject)
✅ Points and rewards system with celebratory animations
✅ Confetti celebrations for achievements and level-ups
✅ 4th grade STAAR Math and Reading questions
✅ Progress tracking and user stats dashboard
✅ Mobile-responsive design optimized for iPad
✅ Encouraging feedback and positive reinforcement
✅ Animated question transitions and feedback

## Quick Start

### Local Development
```bash
# Option 1: Use the startup script
./start-dev.sh

# Option 2: Manual setup
# Terminal 1 - Backend
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
cd backend && python app.py

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

Visit http://localhost:3000 to see the app!

## Project Structure
```
STAARProject/
├── frontend/           # React app
│   ├── src/
│   │   ├── App.js     # Main app with routing
│   │   ├── App.css    # All styles
│   │   └── components/
│   │       ├── Dashboard.js     # Home screen
│   │       ├── LevelSelect.js   # Level selection
│   │       └── GameScreen.js    # Quiz gameplay
│   └── package.json
├── backend/            # Flask API
│   ├── app.py         # API endpoints
│   ├── data/
│   │   └── questions.json  # STAAR questions
│   └── requirements.txt
├── Dockerfile         # Container build
├── start-dev.sh       # Development startup script
└── AZURE_DEPLOYMENT.md # Azure deployment guide
```

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/user/:id` - Get user progress
- `POST /api/user/:id/progress` - Update progress
- `GET /api/questions/:subject?level=N&count=N` - Get questions
- `GET /api/leaderboard` - Get top users

## Adding Content
Edit `backend/data/questions.json` to add more STAAR questions. Each question should have:
- `id`, `level`, `question`, `options[]`, `correct_answer`, `explanation`, `points`, `category`
- Optional `passage` for reading comprehension

## Development Guidelines
- Keep UI colorful and age-appropriate for 4th graders
- Use encouraging, positive language in all feedback
- Implement smooth animations for engagement
- Ensure touch-friendly UI for iPad users
- Test on both desktop browsers and iPad
- Follow Azure best practices for deployment

## Deployment
See [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) for complete Azure deployment instructions.
