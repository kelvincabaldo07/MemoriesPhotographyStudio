# Quick Production Setup - Action Required

## ✅ What's Done
- All security enhancements implemented and pushed to GitHub
- Code is ready for production deployment

## 🔧 What You Need to Do

### Step 1: Deploy to Vercel (5 minutes)

#### Option A: Vercel Dashboard (Easiest)
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Select your GitHub repository: `kelvincabaldo07/MemoriesPhotographyStudio`
4. **Root Directory:** Set to `booking` (important!)
5. Click "Deploy"

#### Option B: Vercel CLI
```bash
cd C:\Users\admin\Documents\GitHub\MemoriesPhotographyStudio\booking
vercel --prod
```

---

### Step 2: Add Environment Variables to Vercel (10 minutes)

Go to: **Project Settings** → **Environment Variables**

Add these variables (get values from your local `.env.local` file):

```
NOTION_API_KEY
NOTION_BOOKINGS_DATABASE_ID
NOTION_SERVICES_DATABASE_ID
NEXT_PUBLIC_N8N_WEBHOOK_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALENDAR_ID
GOOGLE_REFRESH_TOKEN
NEXTAUTH_URL=https://book.memories-studio.com
NEXTAUTH_SECRET
NEXT_PUBLIC_BASE_URL=https://book.memories-studio.com
NEXT_PUBLIC_RECAPTCHA_SITE_KEY
RECAPTCHA_SECRET_KEY
```

**Optional:**
```
NOTION_AUDIT_LOGS_DATABASE_ID
```

**Important:** 
- Set each variable for: Production, Preview, Development
- Click "Save" after each one

---

### Step 3: Update Google reCAPTCHA Domain (2 minutes)

1. Go to https://www.google.com/recaptcha/admin
2. Find your site
3. Settings → **Domains**
4. Add: `book.memories-studio.com`
5. Save

---

### Step 4: Update Google OAuth Redirect URIs (2 minutes)

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client
3. Add **Authorized redirect URIs:**
   - `https://book.memories-studio.com/api/auth/callback/google`
   - `https://book.memories-studio.com/api/calendar/callback`
4. Save

---

### Step 5: Configure n8n for OTP Emails (15 minutes)

Create a new n8n workflow:

1. **Webhook Trigger**
   - Use existing webhook URL from n8n

2. **Filter Node**
   - Condition: `event === "otp_verification"`

3. **Email Node**
   - To: `{{ $json.data.email }}`
   - Subject: "Your Verification Code - Memories Photography"
   - Body: Use the HTML template from DEPLOYMENT.md
   - Variables: `otpCode`, `bookingId`, `expiryMinutes`

4. **Activate Workflow**

**Quick Email Template:**
```html
<h2>Your Verification Code</h2>
<p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">
  {{ $json.data.otpCode }}
</p>
<p>This code expires in {{ $json.data.expiryMinutes }} minutes.</p>
<p>Booking ID: {{ $json.data.bookingId }}</p>
```

---

### Step 6: Test Everything (15 minutes)

Visit: https://book.memories-studio.com

**Test Checklist:**
- [ ] Homepage loads correctly
- [ ] Can navigate to "My Bookings"
- [ ] See "Protected by reCAPTCHA" badge
- [ ] Can search for bookings
- [ ] Can click "Manage Booking"
- [ ] Receive OTP email
- [ ] Can verify OTP code
- [ ] Can view booking details
- [ ] Can reschedule booking
- [ ] Can cancel booking

---

### Step 7: Monitor (Optional but Recommended)

**Check Vercel Logs:**
```bash
vercel logs --follow
```

**Or via Dashboard:**
- Go to Project → Logs
- Monitor for errors

**Check Google reCAPTCHA:**
- https://www.google.com/recaptcha/admin
- View analytics for bot detection

---

## 🚨 If Something Goes Wrong

### Quick Rollback:
1. Go to Vercel → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Disable New Features:
In Vercel environment variables, remove:
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (disables reCAPTCHA)
- System falls back to previous behavior

---

## 📊 What's New in Production

### Security Features:
✅ **reCAPTCHA v3** - Bot protection on all forms
✅ **OTP Verification** - 6-digit codes via email (10-min expiry)
✅ **Audit Logging** - Tracks all booking operations
✅ **Rate Limiting** - 10 requests/min per IP
✅ **Enhanced Email Verification** - Required for all booking access

### User Experience:
- "Protected by reCAPTCHA" badges
- OTP countdown timer
- Better security messages
- All operations logged for support

---

## 📝 Documentation

All documentation is in the `/booking` folder:
- `DEPLOYMENT.md` - Full deployment guide
- `SECURITY_SUMMARY.md` - Overall security architecture
- `RECAPTCHA_IMPLEMENTATION.md` - reCAPTCHA details
- `OTP_IMPLEMENTATION.md` - OTP system details
- `AUDIT_LOGGING.md` - Audit logging guide

---

## ✅ Deployment Checklist

- [ ] Deploy to Vercel
- [ ] Add all environment variables
- [ ] Update reCAPTCHA domains
- [ ] Update Google OAuth URIs
- [ ] Configure n8n OTP workflow
- [ ] Test all functionality
- [ ] Monitor for 24 hours
- [ ] Set up alerts (optional)

---

**Estimated Total Time:** 45-60 minutes
**Status:** Code ready, awaiting your configuration
**Support:** See DEPLOYMENT.md for detailed troubleshooting

