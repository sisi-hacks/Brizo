#!/bin/bash

# Brizo Complete App Deployment Script
echo "🚀 Deploying Brizo Complete App..."

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Please run this script from the brizo root directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend dependency installation failed"
    exit 1
fi

# Go back to root
cd ..

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/data
mkdir -p backend/logs
mkdir -p backend/backups

# Set up environment files
echo "⚙️  Setting up environment files..."
if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env file..."
    cat > backend/.env << EOF
NODE_ENV=development
PORT=3001
DB_PATH=./data/brizo.db
LOG_LEVEL=info
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so
CONTRACT_ENABLED=false
EOF
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend/.env.local file..."
    cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
EOF
fi

# Run database migrations
echo "🗄️  Running database migrations..."
cd backend
node scripts/db.js migrate
if [ $? -ne 0 ]; then
    echo "❌ Database migration failed"
    exit 1
fi

cd ..

# Build frontend
echo "🏗️  Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo "✅ Deployment completed successfully!"
echo ""
echo "🎉 Brizo is ready to run!"
echo ""
echo "To start the application:"
echo "1. Backend:  cd backend && npm run dev"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Or run both with:"
echo "  ./start.sh"
echo ""
echo "📱 Access the app:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:3001"
echo "  Health:   http://localhost:3001/health"
echo ""
echo "🧪 Test the deployment:"
echo "  cd backend && node scripts/test-deployment.js"
