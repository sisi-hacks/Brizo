# 🚀 Brizo Vercel Deployment Guide

Complete guide for deploying Brizo on Vercel with both frontend and backend.

## 📋 Prerequisites

- ✅ GitHub repository connected to Vercel
- ✅ Vercel account (free tier works)
- ✅ Node.js 18+ installed locally
- ✅ Git repository up to date

## 🔧 Quick Fix for Environment Variables

**IMPORTANT**: Before deploying, update these files with your actual backend URL:

1. **Root `vercel.json`**:
```json
"env": {
  "NEXT_PUBLIC_API_URL": "https://your-backend-url.vercel.app"
}
```

2. **`frontend/vercel.json`**:
```json
"env": {
  "NEXT_PUBLIC_API_URL": "https://your-backend-url.vercel.app"
}
```

## 🚀 Step-by-Step Deployment

### **Phase 1: Deploy Backend First**

#### **Step 1: Go to Vercel Dashboard**
1. Visit [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"

#### **Step 2: Import Backend Repository**
1. Find "Brizo" from `sisi-hacks`
2. Click "Import"
3. **Root Directory**: `backend/`
4. **Framework Preset**: Node.js
5. **Build Command**: Leave empty (we'll set it)
6. **Output Directory**: Leave empty
7. **Install Command**: `npm install`
8. Click "Deploy"

#### **Step 3: Configure Backend Environment Variables**
1. Go to Project Settings → Environment Variables
2. Add these variables:
   ```
   NODE_ENV=production
   PORT=3000
   ```
3. Click "Save"

#### **Step 4: Deploy Backend**
1. Click "Deploy" button
2. Wait for deployment to complete
3. **Copy the backend URL** (e.g., `https://brizo-backend-xyz.vercel.app`)

### **Phase 2: Deploy Frontend**

#### **Step 5: Update Frontend Configuration**
1. **Update `frontend/vercel.json`** with your backend URL:
   ```json
   "env": {
     "NEXT_PUBLIC_API_URL": "https://your-actual-backend-url.vercel.app"
   }
   ```

2. **Update root `vercel.json`** with your backend URL:
   ```json
   "env": {
     "NEXT_PUBLIC_API_URL": "https://your-actual-backend-url.vercel.app"
   }
   ```

#### **Step 6: Deploy Frontend**
1. Go back to Vercel Dashboard
2. Click "New Project"
3. Import "Brizo" again
4. **Root Directory**: `frontend/`
5. **Framework Preset**: Next.js (auto-detected)
6. **Build Command**: `npm run build`
7. **Output Directory**: `.next`
8. **Install Command**: `npm install`
9. Click "Deploy"

#### **Step 7: Configure Frontend Environment Variables**
1. Go to Project Settings → Environment Variables
2. Add:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
   ```
3. Click "Save"
4. **Redeploy** the frontend

## 🔄 Alternative: Automated Deployment Script

If you prefer automation, use our script:

```bash
# Make script executable
chmod +x deploy-vercel.sh

# Run deployment
./deploy-vercel.sh
```

## 🌐 Final URLs

After deployment, you'll have:

- **Frontend**: `https://brizo-frontend-xyz.vercel.app`
- **Backend**: `https://brizo-backend-xyz.vercel.app`
- **API Endpoints**: `https://brizo-backend-xyz.vercel.app/api/*`

## ✅ Verification Steps

### **Test Backend**
```bash
curl https://your-backend-url.vercel.app/health
```

### **Test Frontend**
1. Visit your frontend URL
2. Check browser console for API connection
3. Test wallet connection
4. Test payment flow

## 🚨 Common Issues & Solutions

### **Issue 1: Environment Variable Not Found**
- **Solution**: Update `vercel.json` files with actual URLs
- **Fix**: Remove `@brizo-api-url` references

### **Issue 2: Build Failures**
- **Solution**: Check Node.js version (18+ required)
- **Fix**: Update build commands in Vercel

### **Issue 3: API Connection Errors**
- **Solution**: Verify `NEXT_PUBLIC_API_URL` is correct
- **Fix**: Redeploy frontend after updating environment

### **Issue 4: CORS Errors**
- **Solution**: Backend is already configured for CORS
- **Fix**: Ensure frontend URL is in backend CORS settings

## 🏆 For Stacks Competition

**Your deployment will now have:**
- ✅ **Live URLs** for judges
- ✅ **Professional presentation**
- ✅ **Automatic updates** on Git push
- ✅ **Production-ready** application

## 📱 Post-Deployment

1. **Test all functionality**
2. **Update README** with live URLs
3. **Submit to Stacks competition**
4. **Monitor performance** in Vercel dashboard

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Brizo GitHub](https://github.com/sisi-hacks/Brizo)
- [Stacks Documentation](https://docs.stacks.co/)

---

**🎯 Ready to deploy? Follow the steps above and you'll have a professional, live Brizo application!**
