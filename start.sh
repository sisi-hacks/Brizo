#!/bin/bash

# Brizo Start Script - Runs both frontend and backend
echo "🚀 Starting Brizo Complete App..."

# Function to cleanup background processes
cleanup() {
    echo ""
    echo "🛑 Shutting down Brizo..."
    jobs -p | xargs -r kill
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both to start
sleep 5

echo ""
echo "✅ Brizo is now running!"
echo ""
echo "📱 Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  Health:   http://localhost:3001/health"
echo ""
echo "🎯 Quick Links:"
echo "  Home:      http://localhost:3000"
echo "  Demo:      http://localhost:3000/demo"
echo "  Merchant:  http://localhost:3000/merchant"
echo "  API Docs:  http://localhost:3000/merchant/api"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait