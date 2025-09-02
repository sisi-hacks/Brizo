# 🚀 Deploying Brizo on Vercel

This guide will help you deploy Brizo to Vercel for production use.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install with `npm i -g vercel`
3. **Git Repository**: Your code should be in a Git repo (GitHub, GitLab, etc.)

## 🎯 Deployment Options

### Option 1: Frontend Only (Recommended for Demo)

Deploy just the frontend to Vercel and keep the backend running locally or on another service.

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Deploy to Vercel
vercel --prod

# 3. Set environment variable for your backend URL
vercel env add NEXT_PUBLIC_API_URL
# Enter your backend URL (e.g., https://your-backend.vercel.app)
```

### Option 2: Full Stack (Frontend + Backend)

Deploy both frontend and backend to Vercel.

```bash
# 1. Deploy backend first
cd backend
vercel --prod

# 2. Copy the backend URL from the output
# 3. Deploy frontend with backend URL
cd ../frontend
echo "NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app" > .env.local
vercel --prod
```

### Option 3: Automated Deployment

Use our deployment script:

```bash
# Make script executable
chmod +x deploy-vercel.sh

# Run deployment
./deploy-vercel.sh
```

## 🔧 Manual Deployment Steps

### Step 1: Deploy Backend

```bash
cd backend

# Create Vercel config
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
  ]
}
EOF

# Deploy
vercel --prod
```

### Step 2: Deploy Frontend

```bash
cd frontend

# Set backend URL
echo "NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app" > .env.local

# Deploy
vercel --prod
```

## 🌍 Environment Variables

Set these in your Vercel dashboard:

### Backend Environment Variables:
```bash
NODE_ENV=production
DB_PATH=./data/brizo.db
LOG_LEVEL=info
STACKS_NETWORK=testnet
STACKS_API_URL=https://api.testnet.hiro.so
CONTRACT_ENABLED=false
```

### Frontend Environment Variables:
```bash
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
```

## 📱 Custom Domain Setup

1. **Add Domain**: In Vercel dashboard, go to your project → Settings → Domains
2. **Configure DNS**: Add the required DNS records
3. **SSL Certificate**: Vercel automatically provides SSL certificates

## 🔒 Security Considerations

- **CORS**: Update backend CORS settings for your Vercel domain
- **Rate Limiting**: Vercel has built-in rate limiting
- **Environment Variables**: Never commit sensitive data to Git

## 📊 Monitoring & Analytics

- **Vercel Analytics**: Built-in performance monitoring
- **Function Logs**: View serverless function logs in dashboard
- **Performance**: Monitor Core Web Vitals

## 🚨 Common Issues & Solutions

### Issue: CORS Errors
**Solution**: Update backend CORS configuration:
```javascript
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
```

### Issue: Database Path Errors
**Solution**: Use absolute paths or Vercel's `/tmp` directory for file storage

### Issue: Function Timeout
**Solution**: Increase `maxDuration` in vercel.json:
```json
{
  "functions": {
    "server.js": {
      "maxDuration": 60
    }
  }
}
```

## 🔄 Updating Deployments

### Update Frontend:
```bash
cd frontend
vercel --prod
```

### Update Backend:
```bash
cd backend
vercel --prod
```

## 🧹 Removing Deployments

```bash
# Remove specific project
vercel remove --yes

# Or remove from Vercel dashboard
# Go to Project Settings → Delete Project
```

## 📈 Performance Optimization

1. **Image Optimization**: Use Next.js Image component
2. **Code Splitting**: Automatic with Next.js
3. **CDN**: Vercel provides global CDN
4. **Edge Functions**: Consider using for low-latency operations

## 🎉 Success!

After deployment, your Brizo app will be available at:
- **Frontend**: `https://your-project.vercel.app`
- **Backend**: `https://your-backend.vercel.app`

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Brizo Project](https://github.com/your-username/brizo)

---

**Happy Deploying! 🚀**
