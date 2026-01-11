# Resend Email Setup Guide

## ✅ Migration Complete

Your booking system has been updated to use **Resend** instead of SendGrid for email delivery.

## 🚀 Quick Setup (5 minutes)

### 1. Get Your Resend API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name (e.g., "Memories Studio Production")
4. Copy the API key (starts with `re_`)

### 2. Verify Your Domain (Important!)

**Option A: Use Resend's Domain** (Fastest - No setup)
- You can use `onboarding@resend.dev` as your FROM_EMAIL
- This works immediately, no verification needed
- Good for testing, but may land in spam

**Option B: Verify Your Own Domain** (Recommended for production)
1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain: `memories-studio.com`
4. Add the provided DNS records to your domain registrar:
   - SPF record
   - DKIM records (2 records)
5. Wait for verification (usually 5-15 minutes)
6. Once verified, you can use any email like:
   - `noreply@memories-studio.com`
   - `booking@memories-studio.com`
   - `hello@memories-studio.com`

### 3. Update Environment Variables

Update your `.env.local` file (or Vercel environment variables):

```env
# Remove these SendGrid variables (or comment them out):
# SENDGRID_API_KEY=SG.xxx
# SENDGRID_FROM_EMAIL=noreply@memories-studio.com

# Add these Resend variables:
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@memories-studio.com
```

### 4. Install Resend Package

```bash
npm install resend
```

### 5. Test Your Setup

Run the test script:

```bash
node test-resend.js
```

If successful, you'll see: ✅✅✅ SUCCESS! ✅✅✅

### 6. Deploy to Vercel

1. Push your changes to GitHub:
   ```bash
   git add .
   git commit -m "Switch from SendGrid to Resend for email service"
   git push
   ```

2. Add environment variables in Vercel:
   - Go to your Vercel project settings
   - Navigate to "Environment Variables"
   - Add `RESEND_API_KEY` and `FROM_EMAIL`
   - Redeploy your application

## 📝 What Changed?

### Files Updated:
- ✅ Created new email service: [`lib/email.ts`](lib/email.ts)
- ✅ Updated API routes to use new service:
  - [`app/api/verify-email/route.ts`](app/api/verify-email/route.ts)
  - [`app/api/webhooks/notion/route.ts`](app/api/webhooks/notion/route.ts)
  - [`app/api/otp/send/route.ts`](app/api/otp/send/route.ts)
  - [`app/api/bookings/route.ts`](app/api/bookings/route.ts)
- ✅ Created test script: [`test-resend.js`](test-resend.js)

### Old SendGrid Files (Keep for reference):
- [`lib/sendgrid.ts`](lib/sendgrid.ts) - Original SendGrid implementation
- [`test-sendgrid.js`](test-sendgrid.js) - SendGrid test script

You can delete these files once everything is working.

## 🎯 Why Resend?

| Feature | Resend | SendGrid |
|---------|--------|----------|
| Free Tier | 3,000 emails/month | 100 emails/day |
| Setup Time | 5 minutes | 15-30 minutes |
| Domain Verification | Simple DNS records | Complex sender authentication |
| API Simplicity | Very simple | More complex |
| Developer Experience | Excellent | Good |
| Support | Great | Can be slow |

## 🔧 Troubleshooting

### Email not sending?
1. Check your API key is correct
2. Verify FROM_EMAIL domain is verified in Resend
3. Check console logs for error messages
4. Run `node test-resend.js` to diagnose

### Still using SendGrid variables?
Make sure you updated ALL environment variables:
- Local: `.env.local`
- Production: Vercel Dashboard → Settings → Environment Variables

### Domain verification taking too long?
- DNS changes can take up to 24 hours
- Use `onboarding@resend.dev` temporarily for testing
- Check DNS propagation: https://dnschecker.org

## 🆘 Need Help?

1. **Resend Documentation**: https://resend.com/docs
2. **Resend Support**: support@resend.com
3. **Quick Start Guide**: https://resend.com/docs/send-with-nodejs

## 🎉 You're Done!

Your email system is now faster, more reliable, and easier to manage with Resend!
