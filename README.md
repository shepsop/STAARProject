# STAAR Quest - 4th Grade Test Prep Web App

An engaging, gamified web application designed to help 4th graders prepare for the STAAR test in Texas. Features colorful graphics, animations, points system, and progressive levels to make learning fun!

## Features

- 🎮 **Gamified Learning**: Points, levels, and rewards to keep kids engaged
- 📚 **STAAR-Aligned Content**: Math and Reading questions for 4th grade
- 🎨 **Colorful & Animated UI**: Engaging design with smooth animations
- 📱 **iPad & Desktop Friendly**: Responsive design that works on all devices
- 🏆 **Progress Tracking**: Saves user progress and achievements
- ⭐ **Encouraging Feedback**: Positive reinforcement to motivate learning

## Tech Stack

- **Frontend**: React 18 with Framer Motion for animations
- **Backend**: Python Flask API
- **Database**: Azure Cosmos DB (optional, currently using in-memory storage)
- **Deployment**: Azure App Service
- **Styling**: Custom CSS with responsive design

## Project Structure

```
STAARProject/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Dashboard.js
│   │   │   ├── LevelSelect.js
│   │   │   └── GameScreen.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── public/
│   └── package.json
├── backend/               # Flask API
│   ├── app.py            # Main Flask application
│   ├── data/
│   │   └── questions.json # STAAR test questions
│   └── requirements.txt
├── Dockerfile            # Container configuration
└── README.md
```

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- pip

### Setup Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

The backend will run on `http://localhost:8000`

### Setup Frontend

```bash
cd frontend
npm install
npm start
```

The frontend will run on `http://localhost:3000` and proxy API requests to the backend.

## Azure Deployment

### Option 1: Deploy to Existing App Service

If you already have an App Service plan, you can deploy using:

```bash
# Build the Docker container locally
docker build -t staar-quest .

# Tag and push to Azure Container Registry (replace with your ACR name)
docker tag staar-quest <your-acr>.azurecr.io/staar-quest:latest
docker push <your-acr>.azurecr.io/staar-quest:latest

# Deploy to App Service
az webapp create --resource-group <your-rg> --plan <your-plan> --name <app-name> --deployment-container-image-name <your-acr>.azurecr.io/staar-quest:latest
```

### Option 2: Deploy Using Azure Portal

1. Build the Docker container:
   ```bash
   docker build -t staar-quest .
   ```

2. Push to Azure Container Registry or Docker Hub

3. In Azure Portal:
   - Go to your App Service
   - Under "Deployment Center", select "Container Registry"
   - Configure your container image
   - Save and restart

### Environment Variables

Configure these in your Azure App Service:

- `PORT`: 8000 (default)
- `COSMOS_ENDPOINT`: (optional) Your Cosmos DB endpoint
- `COSMOS_KEY`: (optional) Your Cosmos DB key
- `COSMOS_DATABASE`: (optional) Database name
- `COSMOS_CONTAINER`: (optional) Container name

## Adding More Questions

Edit `backend/data/questions.json` to add more questions. Format:

```json
{
  "id": "unique_id",
  "level": 1,
  "question": "Question text?",
  "options": ["A", "B", "C", "D"],
  "correct_answer": 0,
  "explanation": "Explanation of the answer",
  "points": 10,
  "category": "category_name",
  "passage": "Optional reading passage"
}
```

## Future Enhancements

- [ ] User authentication and multiple student profiles
- [ ] Azure Cosmos DB integration for persistent storage
- [ ] More subjects (Science, Social Studies)
- [ ] Parent dashboard to track progress
- [ ] Printable progress reports
- [ ] Daily challenges and streak tracking
- [ ] Multiplayer quiz mode
- [ ] Voice-over for questions (accessibility)

## Contributing

This is a personal educational project. Feel free to fork and customize for your own needs!

## License

MIT License - feel free to use this for educational purposes.

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 3 easy steps
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project overview and next steps
- **[PARENT_GUIDE.md](PARENT_GUIDE.md)** - Tips for parents to support their child's learning
- **[AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md)** - Detailed Azure deployment instructions

## Support

If you encounter any issues or have questions:
1. Check the **QUICK_START.md** guide
2. Review the **PARENT_GUIDE.md** for usage tips
3. See troubleshooting section in documentation

---

Made with ❤️ for 4th grade STAAR test prep

**Good luck to all the amazing 4th graders taking the STAAR test! 🌟**
