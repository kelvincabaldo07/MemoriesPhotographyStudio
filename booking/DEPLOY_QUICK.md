# 🚀 Quick Deploy to Vercel - Cheat Sheet

## ✅ Code is Ready!
Your changes are now pushed to GitHub. Ready to deploy!

---

## 🎯 3-Step Deployment

### Step 1: Go to Vercel
1. Open: **https://vercel.com**
2. Click **"Add New..."** → **"Project"**
3. Find **"MemoriesPhotographyStudio"**
4. Click **"Import"**

### Step 2: Configure Settings
**Root Directory**: Set to `booking` (or auto-detect)

### Step 3: Add Environment Variables
Go to **Settings** → **Environment Variables**

Copy these from your `.env.local` file:

```bash
NOTION_API_KEY
NOTION_BOOKINGS_DATABASE_ID
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALENDAR_ID
GOOGLE_REFRESH_TOKEN
NEXTAUTH_SECRET
NEXT_PUBLIC_N8N_WEBHOOK_URL
```

**Important - Update These:**
```bash
# You'll get this URL after first deploy
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-app-name.vercel.app
```

---

## 🔧 After First Deploy

### 1. Update Google OAuth
Add to Google Console → Credentials:

**Authorized redirect URIs:**
```
https://your-app-name.vercel.app/api/auth/callback/google
```

### 2. Update Vercel Environment Variables
After you know your URL, update:
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_BASE_URL`

Then **Redeploy** from Deployments tab.

---

## ✅ Test Your Site

Visit:
- Homepage: `https://your-app-name.vercel.app`
- Admin Login: `https://your-app-name.vercel.app/admin/login`
- Dashboard: `https://your-app-name.vercel.app/admin/dashboard`
- Chart Test: `https://your-app-name.vercel.app/admin/chart-test`

---

## 📋 Environment Variables Checklist

Copy from `.env.local` to Vercel:

- [ ] `NOTION_API_KEY`
- [ ] `NOTION_BOOKINGS_DATABASE_ID`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `GOOGLE_CALENDAR_ID`
- [ ] `GOOGLE_REFRESH_TOKEN`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXT_PUBLIC_N8N_WEBHOOK_URL`
- [ ] `NEXTAUTH_URL` (update after deploy)
- [ ] `NEXT_PUBLIC_BASE_URL` (update after deploy)

---

## 🆘 Quick Fixes

**Build Failed?**
- Check build logs in Vercel
- Ensure all env variables are set

**Login Not Working?**
- Update Google OAuth redirect URIs
- Verify NEXTAUTH_URL is correct

**Charts Not Showing?**
- Check Function Logs in Vercel
- Verify NOTION_API_KEY is correct

---

## 📖 Full Guide

For detailed instructions, see: `VERCEL_DEPLOYMENT.md`

---

**You're Ready to Deploy!** 🎉

Start here: https://vercel.com
