# reCAPTCHA v3 Implementation

## Overview
Google reCAPTCHA v3 has been integrated into the booking system to protect against bot attacks and automated abuse. This is an invisible CAPTCHA that analyzes user behavior and assigns a risk score without requiring user interaction.

## Implementation Details

### 1. Utility Library (`lib/recaptcha.ts`)
Created a comprehensive utility library with three main functions:

- **`loadRecaptchaScript()`**: Dynamically loads the Google reCAPTCHA script
  - Prevents duplicate script loading
  - Returns promise that resolves when ready
  
- **`executeRecaptcha(action: string)`**: Client-side token generation
  - Generates unique tokens for each action
  - Used in form submissions
  - Returns token string
  
- **`verifyRecaptchaToken(token: string, expectedAction: string)`**: Server-side verification
  - Verifies token with Google API
  - Checks action matches expected value
  - Enforces minimum score of 0.5 (blocks likely bots)
  - Development mode bypass when not configured

### 2. Protected Pages

#### My Bookings Search (`app/my-bookings/page.tsx`)
- **Action**: `search_bookings`
- **Integration Points**:
  - Loads reCAPTCHA script on component mount
  - Generates token on search form submission
  - Sends token via `X-Recaptcha-Token` header
  - Disables search button until reCAPTCHA is ready
  - Shows "Protected by reCAPTCHA" badge when enabled

#### Manage Booking Email Verification (`app/manage/[id]/page.tsx`)
- **Action**: `verify_booking`
- **Integration Points**:
  - Loads reCAPTCHA script on component mount
  - Generates token when verifying email
  - Sends token via `X-Recaptcha-Token` header
  - Disables verify button until reCAPTCHA is ready
  - Shows "Protected by reCAPTCHA" badge when enabled

### 3. Protected API Endpoints

#### GET `/api/bookings` (Search Bookings)
- Verifies reCAPTCHA token before processing search
- Returns 403 with "Security verification failed" if token invalid
- Logs verification failures for monitoring
- Gracefully handles missing token (optional in development)

#### GET `/api/bookings/[id]` (Individual Booking)
- Verifies reCAPTCHA token before returning booking details
- Returns 403 with "Security verification failed" if token invalid
- Logs verification failures for monitoring
- Gracefully handles missing token (optional in development)

## Configuration

### Environment Variables
Add to `.env.local`:

```bash
# Google reCAPTCHA v3 (get from https://www.google.com/recaptcha/admin)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
```

### Getting reCAPTCHA Keys

1. Go to https://www.google.com/recaptcha/admin
2. Register a new site:
   - Label: "Memories Photography Booking"
   - reCAPTCHA type: **reCAPTCHA v3**
   - Domains: 
     - `localhost` (for development)
     - `book.memories-studio.com` (for production)
3. Copy the **Site Key** → `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
4. Copy the **Secret Key** → `RECAPTCHA_SECRET_KEY`

## Security Features

### Score-Based Detection
- Minimum score: **0.5** (range: 0.0 = bot, 1.0 = human)
- Scores below threshold are rejected
- Adjustable threshold in `lib/recaptcha.ts`

### Action Verification
- Each form has a unique action identifier
- Server validates action matches expected value
- Prevents token replay attacks across different forms

### Development Mode
- Works without keys configured (bypass mode)
- Logs warnings instead of blocking requests
- Production requires valid keys for protection

### Graceful Degradation
- UI loads reCAPTCHA asynchronously
- Forms remain functional if script fails to load
- Server accepts requests without token in development
- Production mode can be enforced via environment check

## User Experience

### Invisible Protection
- No CAPTCHA challenges or puzzles
- No user interaction required
- Seamless form submission experience
- Small "Protected by reCAPTCHA" badge for transparency

### Performance
- Script loaded on-demand (not on initial page load)
- Cached after first load
- ~50KB additional payload
- <100ms token generation time

## Monitoring & Debugging

### Client-Side Logs
```javascript
// Check if reCAPTCHA loaded successfully
console.log(window.grecaptcha ? "Loaded" : "Failed");

// Monitor token generation
const token = await executeRecaptcha("search_bookings");
console.log("Token:", token.substring(0, 20) + "...");
```

### Server-Side Logs
```typescript
// Verification failures are logged
console.warn('reCAPTCHA verification failed:', recaptchaResult.error);

// Check verification details
console.log('Score:', recaptchaResult.score);
console.log('Action:', recaptchaResult.action);
```

### Google Admin Console
- View reCAPTCHA analytics at https://www.google.com/recaptcha/admin
- Monitor score distribution
- Track verification attempts
- Identify bot patterns
- Adjust security settings

## Testing

### Development Testing
1. Start dev server: `npm run dev`
2. Without keys: Forms work normally (bypass mode)
3. With keys: Full reCAPTCHA protection active

### Production Testing
1. Register domain in reCAPTCHA admin
2. Add keys to Vercel environment variables
3. Deploy and test forms
4. Monitor scores in Google admin console
5. Adjust threshold if needed (too many false positives)

## Known Limitations

### Current Implementation
- ✅ Client-side token generation
- ✅ Server-side verification
- ✅ Score-based blocking
- ✅ Action verification
- ✅ Development mode bypass
- ❌ No retry mechanism for failed verifications
- ❌ No score logging/analytics storage
- ❌ No admin dashboard for scores

### Future Enhancements
1. **Score Analytics**: Store scores in Notion for pattern analysis
2. **Adaptive Thresholds**: Adjust score threshold based on attack patterns
3. **Retry Logic**: Allow users to retry if verification fails
4. **Admin Dashboard**: View reCAPTCHA stats in admin panel
5. **IP Reputation**: Combine with IP blacklisting for enhanced protection

## Troubleshooting

### "Protected by reCAPTCHA" badge not showing
- Check `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set
- Verify environment variable is properly prefixed with `NEXT_PUBLIC_`
- Restart dev server after adding environment variables

### Forms not submitting (403 errors)
- Verify `RECAPTCHA_SECRET_KEY` is set correctly
- Check Google reCAPTCHA admin console for domain restrictions
- Review server logs for specific error messages
- Ensure domain is registered (localhost or production domain)

### Low scores for legitimate users
- Check for browser extensions blocking reCAPTCHA
- Verify domain is correctly configured
- Consider lowering threshold (current: 0.5)
- Review Google admin console for patterns

### Script loading failures
- Check network tab for blocked requests
- Verify no ad blockers interfering
- Ensure `google.com` is accessible
- Falls back to form without CAPTCHA in dev mode

## Integration Checklist

- [x] Created utility library (`lib/recaptcha.ts`)
- [x] Added environment variables to `.env.local`
- [x] Integrated into My Bookings search form
- [x] Integrated into Manage Booking email verification
- [x] Added server-side verification to search API
- [x] Added server-side verification to individual booking API
- [x] Added UI indicators (loading states, badges)
- [x] Documented implementation
- [ ] **User Action Required**: Get reCAPTCHA keys from Google
- [ ] **User Action Required**: Uncomment keys in `.env.local`
- [ ] **User Action Required**: Add keys to Vercel environment variables

## Next Steps

After obtaining reCAPTCHA keys from Google:

1. Uncomment and fill in keys in `.env.local`:
   ```bash
   NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_actual_site_key
   RECAPTCHA_SECRET_KEY=your_actual_secret_key
   ```

2. Restart development server:
   ```bash
   npm run dev
   ```

3. Test both forms (My Bookings and Manage Booking)

4. Deploy to production with environment variables configured in Vercel

5. Monitor Google reCAPTCHA admin console for verification patterns

---

**Status**: ✅ Implementation Complete | 🔑 Awaiting User Keys
