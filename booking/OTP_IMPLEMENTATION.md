# OTP Email Verification System

## Overview
A secure 6-digit OTP (One-Time Password) email verification system has been implemented to verify user identity when accessing booking management features. This replaces the previous direct email verification with a more secure two-step process.

## Implementation Details

### 1. OTP Library (`lib/otp.ts`)
Core OTP management system with the following features:

#### Functions:
- **`generateOTPCode()`**: Generates random 6-digit codes
- **`createOTP(email, bookingId)`**: Creates and stores OTP with 10-minute expiry
- **`verifyOTP(email, bookingId, code)`**: Verifies OTP with max 5 attempts
- **`getOTPTimeRemaining(email, bookingId)`**: Returns remaining time in milliseconds
- **`otpExists(email, bookingId)`**: Checks if valid OTP exists
- **`cleanupExpiredOTPs()`**: Automatic cleanup every 5 minutes

#### Configuration:
- **OTP Length**: 6 digits
- **Expiry Time**: 10 minutes
- **Max Attempts**: 5 per OTP
- **Storage**: In-memory Map (use Redis for production)
- **Cleanup**: Automatic every 5 minutes

#### Security Features:
- One OTP per email+booking combination
- Automatic expiration after 10 minutes
- Rate limiting (max 5 verification attempts)
- Single-use codes (deleted after successful verification)
- Case-insensitive email matching
- Automatic cleanup of expired codes

### 2. API Endpoints

#### POST `/api/otp/send`
Generates and sends OTP code via email.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "bookingId": "ABC123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification code sent to your email",
  "expiresAt": 1699547890123,
  "expiryMinutes": 10,
  "devCode": "123456"  // Only in development mode
}
```

**Security:**
- ✅ Rate limiting: 3 requests per minute per IP
- ✅ reCAPTCHA v3 protection
- ✅ Validates booking exists with matching email
- ✅ Sends code via n8n webhook
- ✅ Development mode fallback (logs to console)

**n8n Webhook Payload:**
```json
{
  "event": "otp_verification",
  "data": {
    "email": "customer@example.com",
    "bookingId": "ABC123",
    "otpCode": "123456",
    "expiresAt": "2024-11-09T12:34:50.000Z",
    "expiryMinutes": 10
  }
}
```

#### POST `/api/otp/verify`
Verifies the OTP code.

**Request Body:**
```json
{
  "email": "customer@example.com",
  "bookingId": "ABC123",
  "code": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Verification successful"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid code. 3 attempts remaining."
}
```

**Security:**
- ✅ Rate limiting: 10 requests per minute per IP
- ✅ reCAPTCHA v3 protection (optional)
- ✅ Max 5 attempts per OTP
- ✅ Automatic expiration handling
- ✅ Single-use codes

### 3. Updated Manage Booking Page

The `/manage/[id]` page now uses OTP verification instead of direct email access.

#### New Features:
1. **Email Input Stage**
   - User enters email address
   - "Send Verification Code" button
   - reCAPTCHA protected
   
2. **OTP Input Stage**
   - Large 6-digit input field
   - Countdown timer showing expiry
   - "Verify Code" button
   - "Use a different email" option
   - "Resend Code" option (after expiry)

3. **Real-time Countdown Timer**
   - Updates every second
   - Format: MM:SS
   - Disables verify button when expired
   - Shows "Resend Code" when expired

4. **User Experience Enhancements**
   - Auto-format: Only accepts digits
   - Max length: 6 characters
   - Large, monospace font for code input
   - Enter key to submit
   - Auto-focus on code input
   - Clear error messages with remaining attempts

#### UI States:

**Stage 1: Email Entry**
```
┌────────────────────────────┐
│   Verify Your Email        │
│                            │
│   Booking ID: [ABC123   ]  │
│   Email: [_____________ ]  │
│                            │
│   [Send Verification Code] │
│   🛡️ Protected by reCAPTCHA│
└────────────────────────────┘
```

**Stage 2: OTP Entry**
```
┌────────────────────────────┐
│  Enter Verification Code   │
│  Code sent to email@...    │
│                            │
│   Booking ID: [ABC123   ]  │
│   Email: [email@...     ]  │
│   Code: [  1  2  3  4  5  6  ]  │
│   Expires in 9:45          │
│                            │
│   [🛡️ Verify Code]         │
│                            │
│   [Use different email]    │
└────────────────────────────┘
```

**Stage 3: Expired**
```
┌────────────────────────────┐
│  Enter Verification Code   │
│  Code sent to email@...    │
│                            │
│   Code: [expired]          │
│                            │
│   [Resend Code]            │
│   [Use different email]    │
└────────────────────────────┘
```

## n8n Workflow Setup

To send OTP emails, configure your n8n workflow to handle the `otp_verification` event:

### Workflow Trigger:
- **Type**: Webhook
- **URL**: `NEXT_PUBLIC_N8N_WEBHOOK_URL`
- **Method**: POST

### Workflow Logic:
1. **Filter** by `event === "otp_verification"`
2. **Extract** data: `email`, `otpCode`, `expiryMinutes`
3. **Send Email** with template:

```
Subject: Your Memories Photography Verification Code

Hello,

Your verification code is: **{{ otpCode }}**

This code will expire in {{ expiryMinutes }} minutes.

Booking ID: {{ bookingId }}

If you didn't request this code, please ignore this email.

---
Memories Photography Studio
```

### Email Template Example:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .code { 
      font-size: 32px; 
      font-weight: bold; 
      color: #0b3d2e;
      letter-spacing: 8px;
      text-align: center;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h2>Your Verification Code</h2>
  <p>Enter this code to access your booking:</p>
  <div class="code">{{ otpCode }}</div>
  <p>This code expires in {{ expiryMinutes }} minutes.</p>
  <p>Booking ID: <strong>{{ bookingId }}</strong></p>
</body>
</html>
```

## Testing

### Development Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to manage booking page:**
   ```
   http://localhost:3000/manage/[booking-id]
   ```

3. **Check console for OTP code:**
   ```javascript
   // Console will show:
   [OTP] DEV MODE - Code for email@example.com: 123456
   ```

4. **Test expiry:**
   - Wait 10 minutes
   - Code should become invalid
   - "Resend Code" button should appear

5. **Test max attempts:**
   - Enter wrong code 5 times
   - Should show "Too many failed attempts"

### Production Testing

1. **Configure n8n webhook** to send emails
2. **Test email delivery:**
   - Request OTP
   - Check email inbox (including spam)
   - Verify code format and expiry time
3. **Test verification flow:**
   - Enter correct code → Success
   - Enter wrong code → Error with attempts remaining
   - Wait for expiry → Code expired message

## Security Features

### Multi-Layer Protection

1. **Rate Limiting**
   - Send OTP: 3 requests/minute per IP
   - Verify OTP: 10 requests/minute per IP
   - Prevents brute force attacks

2. **reCAPTCHA v3**
   - Protects send endpoint
   - Protects verify endpoint
   - Blocks automated bots

3. **Booking Validation**
   - Verifies booking exists in Notion
   - Confirms email matches booking
   - Prevents OTP generation for invalid requests

4. **Time-Based Expiry**
   - 10-minute window
   - Automatic cleanup
   - No reuse after expiration

5. **Attempt Limiting**
   - Max 5 verification attempts
   - Automatic invalidation after limit
   - Requires new OTP request

6. **Single-Use Codes**
   - Deleted immediately after successful verification
   - Cannot be reused
   - New code required for each session

### Comparison: Old vs New

| Feature | Old (Direct Email) | New (OTP) |
|---------|-------------------|-----------|
| Authentication | Email only | Email + 6-digit code |
| Expiry | None | 10 minutes |
| Attempt Limit | Unlimited | 5 attempts |
| Reuse Prevention | ❌ | ✅ |
| Email Verification | ❌ | ✅ |
| Rate Limiting | Basic | Enhanced |
| Bot Protection | reCAPTCHA | reCAPTCHA + OTP |
| User Experience | 1 step | 2 steps |

## Known Limitations

### Current Implementation
- ✅ 6-digit OTP generation
- ✅ 10-minute expiry
- ✅ Max 5 attempts
- ✅ Rate limiting
- ✅ reCAPTCHA protection
- ✅ Email delivery via n8n
- ✅ Countdown timer UI
- ✅ Auto-cleanup
- ❌ In-memory storage (not distributed)
- ❌ No OTP history/logging
- ❌ No SMS delivery option
- ❌ No backup codes

### Production Considerations

1. **Storage**: Use Redis instead of in-memory Map
   ```javascript
   // Future: Redis implementation
   await redis.setex(`otp:${key}`, 600, JSON.stringify(otpRecord));
   ```

2. **Email Delivery**: Monitor n8n webhook reliability
   - Add retry logic
   - Queue failed deliveries
   - Alert on delivery failures

3. **Rate Limiting**: Use distributed rate limiting
   - Redis-based counters
   - Shared across multiple servers

4. **Monitoring**: Track OTP metrics
   - Success rate
   - Failed attempts
   - Expiry patterns
   - Email delivery time

## Troubleshooting

### OTP not received
1. Check spam/junk folder
2. Verify n8n webhook is running
3. Check n8n workflow logs
4. Verify email service configuration
5. In development: Check console for code

### "No verification code found"
- Code expired (10 minutes passed)
- Wrong email/booking combination
- Code already used
- Solution: Request new code

### "Too many failed attempts"
- Entered wrong code 5 times
- OTP automatically invalidated
- Solution: Request new code

### "Booking not found"
- Email doesn't match booking
- Booking ID incorrect
- Booking doesn't exist in Notion
- Solution: Verify booking ID and email

### Countdown timer not working
- JavaScript disabled
- Page in background (browser throttling)
- Solution: Refresh page, check browser console

## Future Enhancements

### Short-term
1. **SMS Delivery**: Add Twilio integration for SMS codes
2. **Email Templates**: Rich HTML templates with branding
3. **Audit Logging**: Track OTP requests and verifications
4. **Admin Dashboard**: View OTP analytics

### Long-term
1. **Backup Codes**: Generate recovery codes during booking
2. **Redis Storage**: Distributed OTP storage
3. **Multi-channel**: Email + SMS + WhatsApp options
4. **Biometric**: WebAuthn integration for repeat customers
5. **Session Management**: Persistent sessions after verification

## Integration Checklist

- [x] Created OTP utility library (`lib/otp.ts`)
- [x] Created send OTP endpoint (`/api/otp/send`)
- [x] Created verify OTP endpoint (`/api/otp/verify`)
- [x] Updated Manage Booking page with OTP UI
- [x] Added countdown timer
- [x] Added reCAPTCHA protection
- [x] Added rate limiting
- [x] Added email validation
- [x] Added booking validation
- [x] Integrated with n8n webhook
- [x] Development mode fallback
- [x] Error handling and user feedback
- [x] Documented implementation
- [ ] **User Action Required**: Configure n8n workflow for OTP emails
- [ ] **User Action Required**: Test email delivery in production
- [ ] **Future**: Upgrade to Redis storage for production

## Next Steps

1. **Configure n8n workflow** to send OTP emails:
   - Listen for `event: "otp_verification"`
   - Extract `otpCode` from payload
   - Send formatted email to customer

2. **Test the flow**:
   - Request OTP on manage booking page
   - Check email delivery
   - Verify code works correctly

3. **Monitor in production**:
   - Check n8n logs for email delivery
   - Monitor OTP success/failure rates
   - Track average verification time

4. **Consider Redis upgrade** for production scale

---

**Status**: ✅ Implementation Complete | 📧 Awaiting n8n Email Configuration
