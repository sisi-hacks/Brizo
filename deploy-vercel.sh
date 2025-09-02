#!/bin/bash

# Brizo Vercel Deployment Script
echo "🚀 Deploying Brizo to Vercel..."

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    echo "❌ Please run this script from the brizo root directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Installing now..."
    npm install -g vercel
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log in to Vercel first:"
    vercel login
fi

echo "📦 Preparing for deployment..."

# 1. Deploy Backend to Vercel (Serverless Functions)
echo "🔧 Deploying Backend to Vercel..."
cd backend

# Create Vercel configuration for backend
cat > vercel.json << EOF
{
  "version": 2,
  "name": "brizo-backend",
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production",
    "PORT": "3000"
  },
  "functions": {
    "server.js": {
      "maxDuration": 30
    }
  }
}
EOF

# Deploy backend
echo "🚀 Deploying backend..."
BACKEND_URL=$(vercel --prod --yes | grep -o 'https://[^[:space:]]*' | head -1)

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Backend deployment failed"
    exit 1
fi

echo "✅ Backend deployed to: $BACKEND_URL"
cd ..

# 2. Deploy Frontend to Vercel
echo "🎨 Deploying Frontend to Vercel..."
cd frontend

# Update environment variables
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" > .env.local

# Create Vercel configuration for frontend
cat > vercel.json << EOF
{
  "version": 2,
  "name": "brizo-frontend",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "$BACKEND_URL"
  }
}
EOF

# Deploy frontend
echo "🚀 Deploying frontend..."
FRONTEND_URL=$(vercel --prod --yes | grep -o 'https://[^[:space:]]*' | head -1)

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ Frontend deployment failed"
    exit 1
fi

echo "✅ Frontend deployed to: $FRONTEND_URL"
cd ..

# 3. Create deployment summary
echo ""
echo "🎉 Brizo Successfully Deployed to Vercel!"
echo "=========================================="
echo ""
echo "📱 Frontend: $FRONTEND_URL"
echo "🔧 Backend:  $BACKEND_URL"
echo ""
echo "🔗 Quick Links:"
echo "  Home:      $FRONTEND_URL"
echo "  Demo:      $FRONTEND_URL/demo"
echo "  Merchant:  $FRONTEND_URL/merchant"
echo "  API Docs:  $FRONTEND_URL/merchant/api"
echo "  Health:    $BACKEND_URL/health"
echo ""
echo "📊 Monitor your deployment:"
echo "  https://vercel.com/dashboard"
echo ""
echo "🔧 To update deployment:"
echo "  cd frontend && vercel --prod"
echo "  cd backend && vercel --prod"
echo ""
echo "🧹 To remove deployment:"
echo "  vercel remove --yes"
