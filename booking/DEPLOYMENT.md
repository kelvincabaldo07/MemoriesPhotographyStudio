# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables Setup

All environment variables from `.env.local` need to be added to Vercel. Here's what you need to configure:

#### Required Variables

**IMPORTANT:** Copy values from your `.env.local` file. DO NOT commit secrets to GitHub.

```bash
# Notion API
NOTION_API_KEY=<your_notion_api_key>
NOTION_BOOKINGS_DATABASE_ID=<your_bookings_database_id>
NOTION_SERVICES_DATABASE_ID=<your_services_database_id>

# n8n Webhook
NEXT_PUBLIC_N8N_WEBHOOK_URL=<your_n8n_webhook_url>

# Google OAuth
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_CALENDAR_ID=<your_calendar_email>
GOOGLE_REFRESH_TOKEN=<your_google_refresh_token>

# NextAuth
NEXTAUTH_URL=https://book.memories-studio.com
NEXTAUTH_SECRET=<your_nextauth_secret>
NEXT_PUBLIC_BASE_URL=https://book.memories-studio.com

# Google reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<your_recaptcha_site_key>
RECAPTCHA_SECRET_KEY=<your_recaptcha_secret_key>
```

**Note:** Get actual values from your local `.env.local` file and add them directly to Vercel dashboard.

#### Optional Variables

```bash
# Audit Logs (optional - will log to console if not set)
NOTION_AUDIT_LOGS_DATABASE_ID=your_audit_logs_database_id_here
```

---

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Push to GitHub
```bash
cd C:\Users\admin\Documents\GitHub\MemoriesPhotographyStudio\booking
git add .
git commit -m "Add security enhancements: reCAPTCHA, OTP, and Audit Logging"
git push origin main
```

#### Step 2: Import to Vercel
1. Go to https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import `kelvincabaldo07/MemoriesPhotographyStudio`
4. Root Directory: `booking`
5. Framework Preset: Next.js
6. Click "Deploy"

#### Step 3: Configure Environment Variables
1. Go to Project Settings → Environment Variables
2. Add all variables from the list above
3. Set for: Production, Preview, Development
4. Click "Save"

#### Step 4: Redeploy
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

---

### Option 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
cd C:\Users\admin\Documents\GitHub\MemoriesPhotographyStudio\booking
vercel --prod
```

#### Step 4: Add Environment Variables
```bash
# Add each variable one by one
vercel env add NOTION_API_KEY production
# Paste the value when prompted

# Or add all at once from .env file
vercel env pull .env.production
```

---

## Post-Deployment Configuration

### 1. Update Google reCAPTCHA Domains

1. Go to https://www.google.com/recaptcha/admin
2. Find your site: "Memories Photography Booking"
3. Settings → Domains
4. Add your production domain:
   - `book.memories-studio.com`
5. Save

### 2. Update Google OAuth Redirect URIs

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID
3. Add Authorized redirect URIs:
   - `https://book.memories-studio.com/api/auth/callback/google`
   - `https://book.memories-studio.com/api/calendar/callback`
4. Save

### 3. Configure n8n Webhook for OTP Emails

#### Create n8n Workflow:

1. **Webhook Trigger Node**
   - Method: POST
   - Path: `/webhook/booking-created`
   - Authentication: None (or add security token)

2. **Filter Node**
   - Condition: `{{ $json.event }} === "otp_verification"`

3. **Set Variables Node**
   ```javascript
   email: {{ $json.data.email }}
   otpCode: {{ $json.data.otpCode }}
   bookingId: {{ $json.data.bookingId }}
   expiryMinutes: {{ $json.data.expiryMinutes }}
   ```

4. **Email Node (Gmail/SendGrid/etc.)**
   - To: `{{ $json.email }}`
   - Subject: `Your Verification Code - Memories Photography`
   - Body (HTML):
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <style>
       body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
       .container { max-width: 600px; margin: 0 auto; padding: 20px; }
       .header { background: #0b3d2e; color: white; padding: 20px; text-align: center; }
       .code-box { background: #FAF3E0; border: 2px solid #0b3d2e; padding: 30px; text-align: center; margin: 20px 0; }
       .code { font-size: 36px; font-weight: bold; color: #0b3d2e; letter-spacing: 8px; }
       .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
     </style>
   </head>
   <body>
     <div class="container">
       <div class="header">
         <h1>Memories Photography Studio</h1>
       </div>
       <h2>Your Verification Code</h2>
       <p>You requested access to your booking. Please use the code below to verify your identity:</p>
       <div class="code-box">
         <div class="code">{{ $json.otpCode }}</div>
       </div>
       <p><strong>This code will expire in {{ $json.expiryMinutes }} minutes.</strong></p>
       <p>Booking ID: <strong>{{ $json.bookingId }}</strong></p>
       <hr>
       <p>If you didn't request this code, please ignore this email. Your booking is secure.</p>
       <div class="footer">
         <p>© 2024 Memories Photography Studio | smile@memories-studio.com</p>
       </div>
     </div>
   </body>
   </html>
   ```

5. **Activate Workflow**
   - Enable workflow
   - Test by requesting OTP from production site

### 4. Create Notion Audit Logs Database (Optional)

1. **Create Database**
   - Open Notion workspace
   - Click "+ New" → "Database"
   - Name: "Audit Logs"

2. **Add Properties**
   | Property | Type | Options |
   |----------|------|---------|
   | Timestamp | Date | Include time |
   | Booking ID | Text | - |
   | Action | Select | create, update, cancel, view, search, otp_request, otp_verify |
   | Email | Email | - |
   | IP Address | Text | - |
   | User Agent | Text | - |
   | Changes | Text | - |
   | Metadata | Text | - |
   | Status | Select | success (green), failure (yellow), blocked (red) |
   | Error Message | Text | - |

3. **Get Database ID**
   - Open database
   - Copy URL: `https://notion.so/workspace/<DATABASE_ID>?v=...`
   - Extract 32-character ID
   - Add to Vercel environment variables as `NOTION_AUDIT_LOGS_DATABASE_ID`

4. **Create Views**
   - **Recent Activity**: Sort by Timestamp (descending)
   - **Failed Attempts**: Filter Status = failure OR blocked
   - **By Action**: Group by Action
   - **Security Events**: Filter Status = blocked

---

## Testing Production Deployment

### 1. Basic Functionality Tests

```bash
# Test homepage
curl https://book.memories-studio.com

# Test API health
curl https://book.memories-studio.com/api/admin/services/config

# Test reCAPTCHA (should see script loaded)
# Visit: https://book.memories-studio.com/my-bookings
# Check Network tab for: https://www.google.com/recaptcha/api.js
```

### 2. Security Tests

#### Test reCAPTCHA Protection
1. Visit https://book.memories-studio.com/my-bookings
2. Open browser DevTools → Network tab
3. Search for bookings
4. Verify `X-Recaptcha-Token` header present
5. Check Google reCAPTCHA admin console for activity

#### Test OTP Verification
1. Visit https://book.memories-studio.com/manage/[BOOKING_ID]
2. Enter valid email address
3. Check email for OTP code
4. Enter code and verify access granted
5. Test expiry (wait 10 minutes)
6. Test max attempts (enter wrong code 5 times)

#### Test Audit Logging
1. Perform various actions (search, view, update)
2. Check Notion Audit Logs database
3. Verify all fields populated correctly
4. Check for any errors in Vercel logs

### 3. Performance Tests

```bash
# Test response times
curl -w "@curl-format.txt" -o /dev/null -s https://book.memories-studio.com/api/bookings

# Monitor with Vercel Analytics
# Go to Project → Analytics
# Check:
# - Response times
# - Error rates
# - Request volume
```

---

## Monitoring & Alerts

### 1. Vercel Monitoring

**Real-time Logs:**
```bash
vercel logs --follow
```

**Or via Dashboard:**
1. Go to Project → Logs
2. Filter by: Production
3. Monitor for errors

### 2. Google reCAPTCHA Analytics

1. Visit https://www.google.com/recaptcha/admin
2. View Analytics dashboard
3. Monitor:
   - Verification requests
   - Score distribution
   - Bot detection rate
   - False positive rate

### 3. Notion Audit Logs Review

**Daily Checks:**
- Filter Status = "blocked" → Check for attacks
- Filter Status = "failure" → Investigate errors
- Review IP addresses for patterns

**Weekly Reports:**
- Count actions by type
- Identify most active users
- Check for anomalies

### 4. Set Up Alerts (Optional)

#### Vercel Integration Alerts
1. Go to Project → Settings → Integrations
2. Add Slack/Discord integration
3. Configure alert rules:
   - Deployment failures
   - Error rate > 5%
   - Response time > 2s

#### Custom Monitoring
Consider adding:
- Datadog APM
- Sentry error tracking
- UptimeRobot availability monitoring

---

## Rollback Plan

### If Issues Occur After Deployment:

#### Option 1: Instant Rollback via Vercel
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

#### Option 2: Redeploy Previous Commit
```bash
git revert HEAD
git push origin main
# Vercel auto-deploys
```

#### Option 3: Emergency Disable Features
Add to Vercel environment variables:
```bash
# Disable reCAPTCHA (allows unprotected access)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=

# System will fall back to previous behavior
```

---

## Common Issues & Solutions

### Issue 1: reCAPTCHA "Invalid site key"
**Solution:**
- Verify `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is correct
- Check domain is added in Google reCAPTCHA admin
- Ensure domain matches exactly (no www vs www)

### Issue 2: OTP emails not received
**Solution:**
- Check n8n workflow is active
- Verify webhook URL is correct
- Check n8n logs for errors
- Test email service credentials

### Issue 3: Audit logs not appearing in Notion
**Solution:**
- Verify `NOTION_AUDIT_LOGS_DATABASE_ID` is set
- Check Notion API key has write access to database
- Review Vercel logs for errors
- System still works (falls back to console logging)

### Issue 4: OAuth redirect errors
**Solution:**
- Update Google OAuth redirect URIs
- Ensure `NEXTAUTH_URL` matches production domain
- Clear browser cache/cookies

### Issue 5: Rate limiting too aggressive
**Solution:**
- Adjust limits in API files
- Consider per-user limits vs IP limits
- Implement Redis for distributed systems (future upgrade)

---

## Production Optimization

### 1. Enable Vercel Analytics
```bash
# Already enabled in next.config.ts
# View in Vercel dashboard
```

### 2. Configure Caching
```javascript
// next.config.ts
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60' }
        ]
      }
    ]
  }
}
```

### 3. Enable Image Optimization
Already configured via Next.js Image component.

### 4. Set Up CDN
Vercel automatically provides global CDN.

---

## Security Hardening Checklist

- [x] reCAPTCHA v3 enabled
- [x] OTP verification implemented
- [x] Audit logging active
- [x] Rate limiting configured
- [x] Email verification required
- [x] HTTPS enforced (Vercel default)
- [x] Environment variables secured
- [ ] Configure custom domain SSL
- [ ] Set up monitoring alerts
- [ ] Review security headers
- [ ] Enable DDoS protection (Vercel Pro)
- [ ] Implement Redis for production scale

---

## Quick Deploy Commands

```bash
# 1. Ensure you're in the booking directory
cd C:\Users\admin\Documents\GitHub\MemoriesPhotographyStudio\booking

# 2. Commit latest changes
git add .
git commit -m "Ready for production deployment"
git push origin main

# 3. Deploy to Vercel (if using CLI)
vercel --prod

# 4. Or let Vercel auto-deploy from GitHub
# (Configure in Vercel dashboard → Git Integration)
```

---

## Post-Deployment Verification

### Checklist:
- [ ] Site loads at https://book.memories-studio.com
- [ ] reCAPTCHA badge appears on forms
- [ ] Can search for bookings
- [ ] Can request OTP code
- [ ] Receive OTP email
- [ ] Can verify OTP and access booking
- [ ] Can reschedule booking
- [ ] Can cancel booking
- [ ] Audit logs appear in Notion (if configured)
- [ ] No errors in Vercel logs
- [ ] Google reCAPTCHA shows activity
- [ ] All environment variables set correctly

---

**Status:** ✅ Ready for Production Deployment

**Next Steps:**
1. Review environment variables list
2. Deploy via Vercel dashboard or CLI
3. Configure Google services (reCAPTCHA domains, OAuth URIs)
4. Set up n8n OTP email workflow
5. Test all functionality
6. Monitor for 24-48 hours

