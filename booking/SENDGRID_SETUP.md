# SendGrid Email Setup Guide

This guide will help you set up SendGrid for sending booking confirmation and OTP verification emails.

## ✅ Step 1: Create SendGrid API Key

1. **Login to SendGrid**: https://app.sendgrid.com
2. **Navigate to API Keys**:
   - Click **Settings** in the left sidebar
   - Click **API Keys**
3. **Create New Key**:
   - Click **Create API Key** button
   - Name: `Memories Photography Studio`
   - Permissions: Select **Full Access** or minimum **Mail Send**
   - Click **Create & View**
4. **Copy the API Key** immediately (you won't see it again!)
   - Looks like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## ✅ Step 2: Verify Your Sender Email

SendGrid requires verification before you can send emails from an address:

1. **Go to Sender Authentication**:
   - Click **Settings** → **Sender Authentication**
2. **Verify Single Sender**:
   - Click **Verify a Single Sender**
3. **Fill in Your Details**:
   ```
   From Name: Memories Photography Studio
   From Email: noreply@memories-studio.com (or your domain)
   Reply To: bookings@memories-studio.com
   Company Address: [Your business address]
   City: Indang
   State: Cavite
   Country: Philippines
   ```
4. **Create** and check your email inbox
5. **Click verification link** in the email from SendGrid

**Note**: Use a real email you can access. If you don't have a custom domain, you can use a Gmail/Outlook address temporarily.

---

## ✅ Step 3: Add Environment Variables

Edit your `.env.local` file and add these two lines at the bottom:

```bash
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@memories-studio.com
```

**Replace with**:
- Your actual SendGrid API key from Step 1
- The email address you verified in Step 2

---

## ✅ Step 4: Test Locally

1. **Restart your development server**:
   ```bash
   cd booking
   npm run dev
   ```

2. **Test Booking Confirmation Email**:
   - Go to http://localhost:3000
   - Complete a test booking
   - Check the terminal for: `✅ Booking confirmation email sent`
   - Check your email inbox

3. **Test OTP Verification Email**:
   - Go to http://localhost:3000/manage/TEST-BOOKING-ID
   - Click "Request Access"
   - Enter the email from your test booking
   - Check the terminal for: `✅ Verification code sent successfully`
   - Check your email for the 6-digit code

**Troubleshooting**:
- If emails don't arrive, check **spam folder**
- Check terminal logs for errors
- Verify your API key is correct
- Verify your sender email is verified in SendGrid
- In development, the OTP code is also logged to console

---

## ✅ Step 5: Deploy to Production (Vercel)

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `memories-photography-studio`
3. **Go to Settings** → **Environment Variables**
4. **Add these variables**:

   | Name | Value |
   |------|-------|
   | `SENDGRID_API_KEY` | `SG.your_actual_api_key` |
   | `SENDGRID_FROM_EMAIL` | `noreply@memories-studio.com` |

5. **Save** and **redeploy** your application

---

## 📧 Email Templates

Your system now sends two types of emails:

### 1. Booking Confirmation Email
- **Sent when**: Customer completes a booking
- **Contains**: 
  - Booking confirmation number
  - Session details (date, time, location)
  - Package and pricing information
  - Important reminders
  - Link to manage booking
  - Contact information

### 2. OTP Verification Email
- **Sent when**: Customer requests access to manage their booking
- **Contains**:
  - 6-digit verification code
  - 5-minute expiration notice
  - Security instructions

---

## 🔍 Monitoring Emails

1. **SendGrid Dashboard**: 
   - Go to **Activity** → **Activity Feed**
   - See all sent emails, delivery status, and opens

2. **Terminal Logs**:
   ```
   ✅ Booking confirmation email sent
   ✅ Verification code sent successfully to email@example.com
   ```

3. **Console Logs** (development only):
   ```
   [OTP] 🔑 DEV MODE - Code for test@example.com: 123456
   ```

---

## 🚨 Troubleshooting

### Problem: "API key is missing"
**Solution**: Make sure you added `SENDGRID_API_KEY` to `.env.local` and restarted the dev server

### Problem: "Sender email not verified"
**Solution**: Check SendGrid dashboard → Sender Authentication → verify your email

### Problem: Emails go to spam
**Solution**: 
- Use a verified domain (not Gmail/Outlook)
- Set up Domain Authentication in SendGrid (Settings → Sender Authentication → Authenticate Your Domain)

### Problem: "Failed to send via SendGrid"
**Solution**: 
- Check API key is correct
- Check sender email is verified
- System will fallback to n8n if configured
- In development, OTP code is logged to console

---

## 🎯 What's Integrated

✅ **Booking confirmation emails** - Sent automatically when booking is created  
✅ **OTP verification emails** - Sent when customer requests access  
✅ **Professional HTML templates** - Responsive design with your brand colors  
✅ **Fallback to n8n** - If SendGrid fails, system tries n8n webhook  
✅ **Development logging** - OTP codes logged to console in dev mode  
✅ **Error handling** - Emails failures don't break bookings  

---

## 📝 Next Steps

1. ✅ Get SendGrid API key
2. ✅ Verify sender email
3. ✅ Add environment variables to `.env.local`
4. ✅ Test locally
5. ⏳ Deploy to Vercel with environment variables
6. ⏳ Monitor first production emails
7. ⏳ (Optional) Set up domain authentication for better deliverability

---

## 🎨 Email Branding

Your emails use:
- **Forest Green**: `#0b3d2e` (primary color)
- **Cream**: `#FAF3E0` (background)
- **Professional layout** with your business info
- **Mobile-responsive** design
- **Clear call-to-action** buttons

---

## 💡 Pro Tips

1. **Check spam folder** during testing
2. **Use a custom domain** for better deliverability (e.g., noreply@memories-studio.com)
3. **Set up Domain Authentication** in SendGrid for production
4. **Monitor delivery rates** in SendGrid dashboard
5. **Keep n8n webhook** as backup (already configured as fallback)

---

## 🆘 Need Help?

- **SendGrid Docs**: https://docs.sendgrid.com
- **Support Email**: support@sendgrid.com
- **Check Terminal Logs**: See detailed error messages
- **Test in Development**: OTP codes are logged to console

---

**Setup Complete!** 🎉

Your system is now configured to send professional emails via SendGrid with n8n as a fallback.
