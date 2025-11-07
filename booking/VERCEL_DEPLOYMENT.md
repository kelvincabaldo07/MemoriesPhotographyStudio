# 🚀 Vercel Deployment Guide

## Pre-Deployment Checklist

Before deploying to Vercel, ensure:
- ✅ All changes committed to Git
- ✅ GitHub repository is up to date
- ✅ Environment variables are ready
- ✅ Production URL is decided

---

## Step 1: Commit Your Changes

```powershell
# Navigate to booking directory
cd C:\Users\admin\Documents\GitHub\MemoriesPhotographyStudio\booking

# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "feat: upgrade revenue chart with Recharts, 12-month data, and interactive tooltips"

# Push to GitHub
git push origin main
```

---

## Step 2: Vercel Dashboard Setup

### A. Create/Login to Vercel Account
1. Go to: https://vercel.com
2. Click **"Sign Up"** or **"Login"**
3. Choose **"Continue with GitHub"** (recommended)

### B. Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Find **"MemoriesPhotographyStudio"** repository
3. Click **"Import"**

### C. Configure Project Settings

#### Root Directory
Since your Next.js app is in the `booking` folder:
- **Root Directory**: `booking`
- Or leave blank and Vercel will auto-detect

#### Framework Preset
- Vercel should auto-detect: **Next.js**
- If not, select it manually

#### Build Settings (Usually Auto-Detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

---

## Step 3: Configure Environment Variables

### Required Environment Variables

In Vercel dashboard, go to **"Environment Variables"** and add:

#### 1. Notion Credentials
```bash
NOTION_API_KEY=your_notion_api_key_here
NOTION_BOOKINGS_DATABASE_ID=your_database_id_here
```
**Copy these from your `.env.local` file**

#### 2. Google OAuth
```bash
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALENDAR_ID=your_calendar_email@domain.com
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```
**Copy these from your `.env.local` file**

#### 3. NextAuth (IMPORTANT: Update for Production)
```bash
NEXTAUTH_SECRET=your_nextauth_secret_from_env_local
```
**Copy this from your `.env.local` file**

**NEXTAUTH_URL** - This will be your Vercel URL:
```bash
# Option 1: Use Vercel auto-generated URL (initially)
NEXTAUTH_URL=https://your-project-name.vercel.app

# Option 2: Use custom domain (after setup)
NEXTAUTH_URL=https://book.memories-studio.com
```

#### 4. Public Variables
```bash
NEXT_PUBLIC_N8N_WEBHOOK_URL=https://n8n-production-f7c3.up.railway.app/webhook/booking-created
```

**NEXT_PUBLIC_BASE_URL** - Will be your production URL:
```bash
# Option 1: Vercel URL (initially)
NEXT_PUBLIC_BASE_URL=https://your-project-name.vercel.app

# Option 2: Custom domain (after setup)
NEXT_PUBLIC_BASE_URL=https://book.memories-studio.com
```

### How to Add Environment Variables in Vercel

1. In your project dashboard → **"Settings"** → **"Environment Variables"**
2. For each variable:
   - **Key**: Variable name (e.g., `NOTION_API_KEY`)
   - **Value**: Variable value (paste from .env.local)
   - **Environments**: Select **Production**, **Preview**, and **Development**
3. Click **"Save"**
4. Repeat for all variables

---

## Step 4: Update Google OAuth Settings

### Important: Add Vercel URLs to Google Console

1. Go to: https://console.cloud.google.com
2. Select your project
3. Go to **"Credentials"**
4. Find your OAuth 2.0 Client ID
5. Click **"Edit"**

#### Add Authorized JavaScript Origins:
```
https://your-project-name.vercel.app
https://book.memories-studio.com  (if using custom domain)
```

#### Add Authorized Redirect URIs:
```
https://your-project-name.vercel.app/api/auth/callback/google
https://book.memories-studio.com/api/auth/callback/google  (if using custom domain)
```

6. Click **"Save"**

---

## Step 5: Deploy

### Option A: Deploy via Vercel Dashboard
1. After configuring everything, click **"Deploy"**
2. Wait for build to complete (usually 2-5 minutes)
3. Vercel will show you the deployment URL

### Option B: Deploy via CLI (Alternative)

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to booking folder
cd C:\Users\admin\Documents\GitHub\MemoriesPhotographyStudio\booking

# Deploy to production
vercel --prod
```

---

## Step 6: Post-Deployment Steps

### A. Test Your Deployment

Visit your Vercel URL:
```
https://your-project-name.vercel.app
```

Test these pages:
- ✅ Homepage: `/`
- ✅ Admin Login: `/admin/login`
- ✅ Dashboard: `/admin/dashboard` (after login)
- ✅ Chart Test: `/admin/chart-test`

### B. Update NEXTAUTH_URL (If Using Auto-Generated URL)

After first deployment, you'll know your Vercel URL:

1. Go to **Settings** → **Environment Variables**
2. Find `NEXTAUTH_URL`
3. Update value to: `https://your-actual-vercel-url.vercel.app`
4. Find `NEXT_PUBLIC_BASE_URL`
5. Update value to: `https://your-actual-vercel-url.vercel.app`
6. **Trigger Redeploy**: Go to **Deployments** → Click **"..."** on latest → **"Redeploy"**

### C. Verify Environment Variables Loaded

Check Vercel logs:
1. Go to **Deployments**
2. Click on latest deployment
3. Check **"Build Logs"** for any errors
4. Check **"Function Logs"** when testing

---

## Step 7: Custom Domain (Optional)

### If You Want: book.memories-studio.com

1. In Vercel dashboard → **"Settings"** → **"Domains"**
2. Click **"Add"**
3. Enter: `book.memories-studio.com`
4. Vercel will provide DNS instructions

#### Update Your Domain DNS:

Add these records in your domain provider (e.g., Namecheap, GoDaddy):

**A Record:**
```
Type: A
Name: book (or @)
Value: 76.76.21.21
TTL: 3600
```

**CNAME Record (Alternative):**
```
Type: CNAME
Name: book
Value: cname.vercel-dns.com
TTL: 3600
```

5. Wait for DNS propagation (up to 48 hours, usually 1-2 hours)

#### After Domain is Active:

Update environment variables:
```bash
NEXTAUTH_URL=https://book.memories-studio.com
NEXT_PUBLIC_BASE_URL=https://book.memories-studio.com
```

And update Google OAuth redirect URIs (Step 4) with new domain.

---

## Common Issues & Solutions

### Issue 1: Build Fails

**Error**: "Module not found"
**Solution**: 
```powershell
# Ensure all dependencies in package.json
cd booking
npm install
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

### Issue 2: Environment Variables Not Working

**Solution**:
1. Check variable names match exactly (case-sensitive)
2. Ensure selected for Production environment
3. Trigger redeploy after adding variables

### Issue 3: NextAuth Errors

**Error**: "NEXTAUTH_URL mismatch"
**Solution**:
1. Verify `NEXTAUTH_URL` matches your actual URL
2. Must include `https://` protocol
3. No trailing slash

### Issue 4: Google OAuth Not Working

**Error**: "redirect_uri_mismatch"
**Solution**:
1. Add exact Vercel URL to Google Console
2. Include `/api/auth/callback/google` path
3. Wait 5 minutes for changes to propagate

### Issue 5: API Routes 404

**Solution**:
1. Check `next.config.ts` has correct settings
2. Ensure `output: 'standalone'` is set (it is)
3. Redeploy

---

## Monitoring & Logs

### View Deployment Logs
1. **Deployments** tab → Click on deployment
2. **Build Logs** - Shows build process
3. **Function Logs** - Shows runtime logs

### View Analytics
1. **Analytics** tab
2. See page views, performance, etc.

### Set Up Alerts
1. **Settings** → **Notifications**
2. Configure deployment notifications
3. Add webhook for build failures

---

## Automatic Deployments

### Enable Auto-Deploy from GitHub

Vercel automatically deploys when you push to GitHub:

- **main branch** → Production deployment
- **Other branches** → Preview deployments

To disable auto-deploy:
1. **Settings** → **Git**
2. Uncheck "Production Branch"

---

## Quick Reference

### Vercel CLI Commands

```powershell
# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# List deployments
vercel ls

# View logs
vercel logs [deployment-url]

# Remove deployment
vercel remove [deployment-name]
```

### Important URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Google Console**: https://console.cloud.google.com
- **Notion Integrations**: https://www.notion.so/my-integrations

---

## Final Checklist

Before going live:

- [ ] All code committed and pushed to GitHub
- [ ] All environment variables added in Vercel
- [ ] Google OAuth redirect URIs updated
- [ ] NEXTAUTH_URL matches production URL
- [ ] NEXT_PUBLIC_BASE_URL matches production URL
- [ ] Test login on production
- [ ] Test dashboard on production
- [ ] Test chart interactivity
- [ ] Check mobile responsiveness
- [ ] Verify dark mode works
- [ ] Custom domain configured (if applicable)

---

## Next Steps After Deployment

1. **Share the URL** with your team
2. **Monitor logs** for any errors
3. **Test all features** in production
4. **Set up monitoring** (optional: Sentry, LogRocket)
5. **Configure backups** for Notion data

---

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console for errors
3. Verify environment variables
4. Check Google OAuth settings
5. Review Next.js documentation: https://nextjs.org/docs

---

**Ready to Deploy!** 🚀

Start with Step 1: Commit your changes to Git, then proceed to Vercel!
