# 🚀 Brizo Full-Stack Vercel Deployment Guide

Complete guide for deploying Brizo as a **single full-stack project** on Vercel.

## 📋 Prerequisites

- ✅ GitHub repository connected to Vercel
- ✅ Vercel account (free tier works)
- ✅ Node.js 18+ installed locally
- ✅ Git repository up to date

## 🎯 Single Full-Stack Deployment

**Brizo is now configured as a MONOREPO that deploys both frontend and backend together!**

### **🚀 One-Click Deployment**

#### **Step 1: Go to Vercel Dashboard**
1. Visit [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click **"New Project"**

#### **Step 2: Import Full-Stack Repository**
1. Find **"Brizo"** from `sisi-hacks`
2. Click **"Import"**
3. **Root Directory**: Leave as root (don't change)
4. **Framework Preset**: Auto-detected as monorepo
5. **Build Command**: Auto-detected
6. **Output Directory**: Auto-detected
7. **Install Command**: Auto-detected
8. Click **"Deploy"**

#### **Step 3: Configure Environment Variables**
1. Go to **Project Settings** → **Environment Variables**
2. Add these variables:
   ```
   NODE_ENV=production
   PORT=3000
   NEXT_PUBLIC_API_URL=https://your-project.vercel.app/api
   ```
3. Click **"Save"**

#### **Step 4: Deploy Everything**
1. Click **"Deploy"** button
2. Wait for both frontend and backend to deploy
3. **🎉 Done!** Both services are now live

---

## 🌐 How It Works

### **Single Project Structure:**
```
brizo/
├── frontend/          # Next.js app
├── backend/           # Express.js API
└── vercel.json        # Full-stack config
```

### **Automatic Routing:**
- **Frontend**: `https://your-project.vercel.app/`
- **Backend API**: `https://your-project.vercel.app/api/*`
- **Health Check**: `https://your-project.vercel.app/api/health`

### **Smart Build Process:**
1. **Backend**: Builds as Node.js serverless functions
2. **Frontend**: Builds as Next.js static site
3. **Routing**: Vercel automatically routes `/api/*` to backend

---

## ✅ Verification Steps

### **Test Backend API**
```bash
curl https://your-project.vercel.app/api/health
```

### **Test Frontend**
1. Visit your project URL
2. Check browser console for API connection
3. Test wallet connection
4. Test payment flow

---

## 🔄 Alternative: Automated Deployment Script

If you prefer automation, use our script:

```bash
# Make script executable
chmod +x deploy-vercel.sh

# Run deployment
./deploy-vercel.sh
```

---

## 🌐 Final URLs

After deployment, you'll have:

- **Frontend**: `https://your-project.vercel.app`
- **Backend API**: `https://your-project.vercel.app/api/*`
- **Health Check**: `https://your-project.vercel.app/api/health`
- **Payment Creation**: `https://your-project.vercel.app/api/create-payment`

---

## 🚨 Common Issues & Solutions

### **Issue 1: Build Failures**
- **Solution**: Check Node.js version (18+ required)
- **Fix**: Ensure all dependencies are in package.json

### **Issue 2: API Connection Errors**
- **Solution**: Verify `NEXT_PUBLIC_API_URL` is correct
- **Fix**: Should be `https://your-project.vercel.app/api`

### **Issue 3: Route Not Found**
- **Solution**: All backend routes now use `/api` prefix
- **Fix**: Frontend calls `/api/endpoint`, not `/endpoint`

### **Issue 4: CORS Errors**
- **Solution**: Backend is configured for production CORS
- **Fix**: No additional configuration needed

---

## 🏆 For Stacks Competition

**Your deployment will now have:**
- ✅ **Single URL** for judges to test
- ✅ **Professional full-stack presentation**
- ✅ **Automatic updates** on Git push
- ✅ **Production-ready** application
- ✅ **Simplified management**

---

## 📱 Post-Deployment

1. **Test all functionality**
2. **Update README** with live URL
3. **Submit to Stacks competition**
4. **Monitor performance** in Vercel dashboard

---

## 🔗 Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Brizo GitHub](https://github.com/sisi-hacks/Brizo)
- [Stacks Documentation](https://docs.stacks.co/)

---

## 🎯 Why Single Deployment is Better

### **✅ Advantages:**
- **One URL** for everything
- **Simplified management**
- **Automatic routing**
- **Better for competitions**
- **Easier to maintain**

### **🔄 Before (Separate):**
- Frontend: `https://brizo-frontend.vercel.app`
- Backend: `https://brizo-backend.vercel.app`
- Complex environment setup

### **🎉 Now (Single):**
- Everything: `https://brizo.vercel.app`
- Frontend: `/`
- Backend: `/api/*`
- Simple and professional

---

**🎯 Ready to deploy? Just import the repository and click deploy!**

**Everything is now configured for single full-stack deployment!** 🚀
