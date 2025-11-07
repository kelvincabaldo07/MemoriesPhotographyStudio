# Complete Setup Checklist for Admin Dashboard

## 📋 Pre-Setup Checklist

Before you begin, make sure you have:
- [ ] A Notion account (free plan works)
- [ ] A Google account (for OAuth login)
- [ ] Access to Google Cloud Console
- [ ] Your existing Google Calendar with API access

---

## 1️⃣ Notion Database Setup (15 minutes)

### Create Database
- [ ] Open [Notion](https://www.notion.so)
- [ ] Create new page
- [ ] Add inline table database
- [ ] Name it "Photography Bookings"

### Add Properties (exact names, case-sensitive!)
- [ ] **Name** (Title) - already exists as default
- [ ] **Email** (Email type)
- [ ] **Phone** (Phone type)
- [ ] **Service** (Select type)
- [ ] **Date** (Date type)
- [ ] **Time** (Text type)
- [ ] **Duration** (Number type)
- [ ] **Backdrops** (Multi-select type)
- [ ] **Status** (Select type)
- [ ] **Price** (Number type)

### Configure Select Options
**Service** (6 options):
- [ ] Standard - Studio Only
- [ ] Birthday Package
- [ ] With Photographer
- [ ] Christmas Package
- [ ] One on One (45 mins)
- [ ] One on One (60 mins)

**Backdrops** (8 options):
- [ ] Backdrop 1
- [ ] Backdrop 2
- [ ] Backdrop 3
- [ ] Backdrop 4
- [ ] Backdrop 5
- [ ] Backdrop 6
- [ ] Backdrop 7
- [ ] Backdrop 8

**Status** (4 options):
- [ ] Pending
- [ ] Confirmed
- [ ] Completed
- [ ] Cancelled

### Add Sample Data (3 test bookings)
- [ ] Booking 1: John Doe - Birthday Package
- [ ] Booking 2: Maria Santos - With Photographer
- [ ] Booking 3: Pedro Cruz - Standard Session

---

## 2️⃣ Notion Integration Setup (5 minutes)

- [ ] Go to [Notion Integrations](https://www.notion.so/my-integrations)
- [ ] Click "+ New integration"
- [ ] Name: "Memories Photography Booking System"
- [ ] Select your workspace
- [ ] Click "Submit"
- [ ] Copy the integration token (starts with `secret_`)
- [ ] Save as `NOTION_API_KEY` (you'll need this later)

### Connect Integration to Database
- [ ] Open your "Photography Bookings" database
- [ ] Click "•••" menu (top right)
- [ ] Click "+ Add connections"
- [ ] Select "Memories Photography Booking System"
- [ ] Click "Confirm"

### Get Database ID
- [ ] Copy the database URL
- [ ] Extract the 32-character ID between workspace name and `?v=`
- [ ] Example: `notion.so/workspace/THIS_IS_YOUR_DATABASE_ID?v=view`
- [ ] Save as `NOTION_DATABASE_ID`

---

## 3️⃣ Google OAuth Setup (10 minutes)

### Create OAuth Credentials
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Select your project (or create new one)
- [ ] Enable "Google+ API" if not enabled
- [ ] Go to "Credentials" → "Create Credentials" → "OAuth client ID"
- [ ] Application type: "Web application"
- [ ] Name: "Memories Photography Admin"

### Configure OAuth
- [ ] Add authorized JavaScript origins:
  - `http://localhost:3000`
  - `https://your-domain.vercel.app` (for production)
- [ ] Add authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://your-domain.vercel.app/api/auth/callback/google`
- [ ] Click "Create"
- [ ] Copy **Client ID** → save as `GOOGLE_CLIENT_ID`
- [ ] Copy **Client Secret** → save as `GOOGLE_CLIENT_SECRET`

---

## 4️⃣ Generate NextAuth Secret (2 minutes)

Run this command in PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
- [ ] Copy the generated string
- [ ] Save as `NEXTAUTH_SECRET`

---

## 5️⃣ Create .env.local File (5 minutes)

- [ ] Copy `.env.local.template` to `.env.local`
- [ ] Fill in all the values you've collected:

```env
NEXTAUTH_SECRET=<from step 4>
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=<from step 3>
GOOGLE_CLIENT_SECRET=<from step 3>

GOOGLE_CALENDAR_ID=<your existing calendar ID>
GOOGLE_CALENDAR_API_KEY=<your existing API key>
GOOGLE_CALENDAR_REFRESH_TOKEN=<your existing refresh token>

NOTION_API_KEY=<from step 2>
NOTION_DATABASE_ID=<from step 2>

N8N_WEBHOOK_URL=<your existing webhook URL>

NEXT_PUBLIC_GOOGLE_CALENDAR_ID=<same as GOOGLE_CALENDAR_ID>
NEXT_PUBLIC_NOTION_DATABASE_ID=<same as NOTION_DATABASE_ID>
```

---

## 6️⃣ Test the Setup (5 minutes)

### Start Development Server
```powershell
cd C:\Users\admin\Documents\GitHub\MemoriesPhotographyStudio\booking
npm run dev
```

### Test Admin Login
- [ ] Open browser to `http://localhost:3000/admin/login`
- [ ] Click "Sign in with Google"
- [ ] Use authorized email: `smile@memories-studio.com` or `kelvin.cabaldo@gmail.com`
- [ ] Should redirect to `/admin/dashboard`

### Test Each Page
- [ ] **Dashboard** - Shows overview stats
- [ ] **Bookings** - Shows your 3 sample bookings from Notion
- [ ] **Customers** - Shows aggregated customer data
- [ ] **Services** - Shows all service packages
- [ ] **Availability** - Shows weekly schedule
- [ ] **Analytics** - Shows charts and trends
- [ ] **Settings** - Shows integrations status

---

## 7️⃣ Verify Data Flow (5 minutes)

### Test Customer Booking Form
- [ ] Open `http://localhost:3000` (customer booking page)
- [ ] Fill out a test booking
- [ ] Submit the form
- [ ] Check that it appears in Notion database
- [ ] Check that it appears in admin dashboard `/admin/bookings`
- [ ] Verify email notification was sent (if N8N configured)

---

## 🎯 Success Criteria

Your setup is complete when:
- ✅ You can log in to admin dashboard
- ✅ You see sample bookings in the Bookings page
- ✅ Customer data shows in Customers page
- ✅ All 6 admin pages load without errors
- ✅ New bookings from customer form appear in Notion and admin
- ✅ Email notifications work (optional, requires N8N)

---

## ⚠️ Troubleshooting

### Can't log in to admin
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Verify redirect URI includes `/api/auth/callback/google`
- Make sure email is in authorized list (`lib/auth.ts`)

### Bookings page is empty
- Verify `NOTION_API_KEY` starts with `secret_`
- Check `NOTION_DATABASE_ID` is 32 characters (no dashes)
- Ensure integration is connected to database
- Check browser console for errors

### Database errors
- Verify all property names match exactly (case-sensitive)
- Check property types are correct
- Ensure database has at least one entry

### Environment variables not loading
- Restart dev server after changing `.env.local`
- Check file is named `.env.local` not `.env.local.template`
- Ensure file is in `booking` folder, not root

---

## 📚 Additional Resources

- [NOTION_SETUP.md](./NOTION_SETUP.md) - Detailed Notion setup guide
- [NOTION_TEMPLATE.md](./NOTION_TEMPLATE.md) - Quick template reference
- [.env.example](./.env.example) - Environment variables reference

---

## 🎉 Next Steps After Setup

1. **Customize Services**: Update pricing and durations in Services page
2. **Configure Schedule**: Adjust business hours in Availability page
3. **Add Team Members**: Add more authorized admin emails in Settings
4. **Deploy to Vercel**: Push to GitHub and deploy
5. **Test Production**: Verify everything works in production
6. **Monitor Analytics**: Check dashboard regularly for insights

---

**Setup Time Estimate**: ~45 minutes total

**Questions?** Check the Notion API docs or Next.js documentation for help.
