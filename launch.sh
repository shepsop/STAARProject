#!/bin/bash

# STAAR Quest - Complete Setup and Launch Script
# This script will set up and launch the entire application

set -e  # Exit on any error

echo "════════════════════════════════════════════════════════════════"
echo "        🌟 STAAR Quest - Setup & Launch 🌟"
echo "        4th Grade Test Prep Web Application"
echo "════════════════════════════════════════════════════════════════"
echo ""

PROJECT_DIR="/Users/robert/projects/STAARProject"

cd "$PROJECT_DIR"

# Check if this is first time setup
FIRST_TIME=false
if [ ! -d "venv" ] || [ ! -d "frontend/node_modules" ]; then
    FIRST_TIME=true
fi

if [ "$FIRST_TIME" = true ]; then
    echo "📦 First-time setup detected. This will take a few minutes..."
    echo ""
fi

# Step 1: Python Virtual Environment
echo "🐍 Step 1: Setting up Python environment..."
if [ ! -d "venv" ]; then
    echo "   Creating virtual environment..."
    python3 -m venv venv
else
    echo "   ✓ Virtual environment already exists"
fi

source venv/bin/activate
echo "   ✓ Virtual environment activated"

# Step 2: Backend Dependencies
echo ""
echo "📚 Step 2: Installing backend dependencies..."
pip install -q --upgrade pip
pip install -q -r backend/requirements.txt
echo "   ✓ Backend dependencies installed"

# Step 3: Frontend Dependencies
echo ""
echo "⚛️  Step 3: Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "   This may take 2-3 minutes on first run..."
    npm install --silent
    echo "   ✓ Frontend dependencies installed"
else
    echo "   ✓ Frontend dependencies already installed"
fi
cd ..

# Success message
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ Setup Complete! Starting STAAR Quest..."
echo "════════════════════════════════════════════════════════════════"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping STAAR Quest..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✓ Servers stopped"
    exit 0
}

trap cleanup INT TERM

# Start Backend
echo "🚀 Starting Flask backend on http://localhost:8000..."
cd backend
python app.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
sleep 2

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo "   ✓ Backend is running (PID: $BACKEND_PID)"
else
    echo "   ❌ Backend failed to start. Check backend.log for details."
    exit 1
fi

# Start Frontend
echo ""
echo "🎨 Starting React frontend on http://localhost:3000..."
cd frontend
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
sleep 3

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    echo "   ✓ Frontend is running (PID: $FRONTEND_PID)"
else
    echo "   ❌ Frontend failed to start. Check frontend.log for details."
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🎉 STAAR Quest is now running!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📱 Open your browser to: http://localhost:3000"
echo "🔧 Backend API:          http://localhost:8000"
echo ""
echo "📖 For help, see:"
echo "   - QUICK_START.md (setup guide)"
echo "   - PARENT_GUIDE.md (usage tips)"
echo "   - PROJECT_SUMMARY.md (overview)"
echo ""
echo "🛑 Press Ctrl+C to stop both servers"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Wait for processes
wait
