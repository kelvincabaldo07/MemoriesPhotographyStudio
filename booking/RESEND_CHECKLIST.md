# ✅ Resend Migration Checklist

## Step-by-Step Setup

### 1. Get Resend API Key ⏱️ 2 minutes
- [ ] Go to https://resend.com/api-keys
- [ ] Create new API key
- [ ] Copy the key (starts with `re_`)

### 2. Choose Email Option ⏱️ 1-5 minutes

**Quick Start (No domain setup needed):**
- [ ] Use `onboarding@resend.dev` as FROM_EMAIL
- [ ] Good for immediate testing

**OR Production Setup (Recommended):**
- [ ] Go to https://resend.com/domains
- [ ] Add your domain: `memories-studio.com`
- [ ] Add DNS records to your domain registrar
- [ ] Wait for verification (5-15 minutes)
- [ ] Use your custom email: `noreply@memories-studio.com`

### 3. Update Environment Variables ⏱️ 2 minutes

**Local Development (.env.local):**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@memories-studio.com
```

**Production (Vercel):**
- [ ] Go to Vercel Project Settings
- [ ] Click "Environment Variables"
- [ ] Add `RESEND_API_KEY`
- [ ] Add `FROM_EMAIL`

### 4. Install and Test ⏱️ 3 minutes
- [ ] Run: `npm install`
- [ ] Run: `node test-resend.js`
- [ ] Verify you see: ✅✅✅ SUCCESS! ✅✅✅

### 5. Deploy ⏱️ 5 minutes
- [ ] Commit changes: `git add .`
- [ ] Push: `git commit -m "Migrate to Resend" && git push`
- [ ] Verify deployment in Vercel
- [ ] Test sending an email from production

### 6. Cleanup (Optional)
- [ ] Remove SendGrid environment variables
- [ ] Delete `lib/sendgrid.ts`
- [ ] Delete `test-sendgrid.js`
- [ ] Uninstall: `npm uninstall @sendgrid/mail`

---

## 🎯 Quick Reference

### Environment Variables Needed:
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=noreply@memories-studio.com
```

### Test Command:
```bash
node test-resend.js
```

### Files Changed:
- ✅ `lib/email.ts` (NEW - Resend service)
- ✅ `app/api/verify-email/route.ts`
- ✅ `app/api/webhooks/notion/route.ts`
- ✅ `app/api/otp/send/route.ts`
- ✅ `app/api/bookings/route.ts`
- ✅ `package.json`
- ✅ `test-resend.js` (NEW)

---

## 📞 Support

**Resend Issues:**
- Docs: https://resend.com/docs
- Support: support@resend.com

**Domain Setup Help:**
- Check DNS: https://dnschecker.org
- Resend Domain Guide: https://resend.com/docs/dashboard/domains/introduction

---

**Estimated Total Time: 10-15 minutes** ⏱️

Good luck! 🚀
