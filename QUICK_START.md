# Quick Start Guide - STAAR Quest

## 🚀 Get Started in 3 Steps!

### Step 1: Install Frontend Dependencies
Make sure you have the required Node.js/npm versions (see `frontend/requirements.txt`).

Open a terminal and run:
```bash
cd frontend
npm install
```
This will take 2-3 minutes to download all React dependencies.

### Step 2: Install Backend Dependencies & Start the Backend
In a new terminal:
```bash
python3 -m venv venv                             # Create Python virtual environment
source venv/bin/activate                         # Activate Python virtual environment
pip install -r backend/requirements.txt          # Install Flask and dependencies
cd backend
python3 app.py                                   # Start the backend server
```
The backend will start on http://localhost:8000

### Step 3: Start the Frontend
In another terminal:
```bash
cd frontend
npm start
```
The app will automatically open in your browser at http://localhost:3000!

---

## 🎮 How to Use the App

### For Your Child:
1. **Dashboard**: Choose between Math or Reading
2. **Level Select**: Pick a level (levels unlock as you progress!)
3. **Play**: Answer questions and earn stars ⭐
4. **Level Up**: Get 100 points to unlock the next level! 🎉

### Levels:
- **Level 1** (🌱 Beginner): Easy questions to build confidence
- **Level 2** (🔍 Explorer): Medium difficulty
- **Level 3** (🏆 Champion): Challenging questions
- **Level 4** (⭐ Star Player): Advanced problems
- **Level 5** (👑 Legend): Expert level!

### Points System:
- **Level 1**: 10 points per correct answer
- **Level 2**: 15-20 points per correct answer
- **Level 3**: 25-30 points per correct answer
- **100 points** = Level Up! 🎊

---

## 📝 Adding More Questions

Edit `/backend/data/questions.json`:

```json
{
  "math": [
    {
      "id": "m9",
      "level": 1,
      "question": "What is 3 + 4?",
      "options": ["5", "6", "7", "8"],
      "correct_answer": 2,
      "explanation": "Great job! 3 + 4 = 7",
      "points": 10,
      "category": "addition"
    }
  ],
  "reading": [
    {
      "id": "r7",
      "level": 2,
      "passage": "Your story here...",
      "question": "What happened in the story?",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 0,
      "explanation": "Perfect! The story showed...",
      "points": 15,
      "category": "comprehension"
    }
  ]
}
```

After editing, restart the backend server.

---

## 🎨 Customization Ideas

### Change Colors
Edit `frontend/src/App.css`:
- Line 9: Background gradient
- Line 43: Header gradient
- Line 253: Subject card colors

### Add More Subjects
1. Add questions to `backend/data/questions.json` with a new subject key
2. Add a new card in `Dashboard.js`
3. Update routes in `App.js`

### Adjust Difficulty
- Modify `points` values in questions
- Change level-up threshold in `backend/app.py` (currently 100 points)

---

## 🐛 Troubleshooting

### Backend won't start?
```bash
# Make sure virtual environment is active
source venv/bin/activate
pip install -r backend/requirements.txt
```

### Frontend won't start?
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Can't see questions?
Check that `backend/data/questions.json` exists and has valid JSON.

### Port already in use?
```bash
# Kill process on port 8000 (backend)
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

---

## ☁️ Deploy to Azure

See `AZURE_DEPLOYMENT.md` for complete Azure deployment instructions with:
- Docker container setup
- Azure Container Registry
- App Service deployment
- Cosmos DB integration (optional)

---

## 💡 Tips for Success

1. **Start with Level 1** to build confidence
2. **Read explanations** even when you get it right!
3. **Practice daily** to maintain streak
4. **Celebrate mistakes** as learning opportunities
5. **Mix subjects** to keep it interesting

---

## 🎯 STAAR Test Day Tips

1. Read questions carefully
2. Use process of elimination
3. Check your work
4. Don't spend too long on one question
5. Stay calm and confident!

---

## 📞 Need Help?

- Check `README.md` for detailed information
- See `AZURE_DEPLOYMENT.md` for deployment help
- Review code comments in `backend/app.py` and `frontend/src/App.js`

**Good luck with the STAAR test! You've got this! 🌟**
