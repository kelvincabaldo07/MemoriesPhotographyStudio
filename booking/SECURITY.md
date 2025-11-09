# Security Documentation

## Customer Booking System Security Measures

This document outlines the security measures implemented to protect customer data and prevent unauthorized access to bookings.

---

## 🔒 API Security

### 1. **Email Verification Required**

All booking management operations require email verification to ensure only the booking owner can access their data.

#### GET `/api/bookings/[id]`
- **Required**: `?email=customer@email.com` query parameter
- **Validation**: Queries Notion with both Booking ID AND email
- **Response**: 401 Unauthorized if email not provided
- **Response**: 404 Not Found if email doesn't match booking

#### PUT `/api/bookings/[id]` (Reschedule)
- **Required**: `email` in request body
- **Validation**: Verifies email matches booking before allowing updates
- **Response**: 403 Forbidden if email doesn't match

#### DELETE `/api/bookings/[id]` (Cancel)
- **Required**: `?email=customer@email.com` query parameter
- **Validation**: Verifies email matches booking before cancellation
- **Response**: 403 Forbidden if email doesn't match
- **Note**: Sets status to "Cancelled" instead of deleting data

---

### 2. **Rate Limiting**

#### GET `/api/bookings` (Search)
- **Limit**: 10 requests per minute per IP address
- **Response**: 429 Too Many Requests when exceeded
- **Purpose**: Prevents brute force attacks and email enumeration

---

### 3. **Data Minimization**

#### Search Results
- **Address Field**: Removed from list view (only shown in detail view after verification)
- **Limited Fields**: Only essential booking information exposed in search

#### Error Messages
- **Generic Errors**: Internal errors don't expose system details
- **No Stack Traces**: Error details only logged server-side

---

## 🛡️ Frontend Security

### Manage Booking Page
- **Email Verification Screen**: Required before viewing any booking details
- **Session Persistence**: Email stored in component state (not persisted)
- **Clean URLs**: No sensitive data in URL parameters except booking ID

### My Bookings Search
- **Exact Match Required**: Must provide correct email OR first name + last name
- **No Autocomplete**: Search doesn't suggest existing emails/names
- **Rate Limited**: Backed by API rate limiting

---

## 🔐 Data Protection

### Environment Variables
All sensitive credentials stored securely in environment variables:
- `NOTION_API_KEY` - Never exposed to client
- `NOTION_BOOKINGS_DATABASE_ID` - Server-side only
- `N8N_WEBHOOK_URL` - Optional, server-side only

### Notion Access
- **Filtered Queries**: All queries filter by both Booking ID and Email
- **No List All**: Cannot retrieve all bookings without search criteria
- **Read-Only for Customers**: Customers can only view/update their own bookings

---

## ⚠️ Security Considerations

### Current Limitations
1. **Email as Auth**: Uses email verification instead of passwords
   - ✅ **Pro**: Simple, no password management
   - ⚠️ **Con**: Anyone with access to email can manage booking
   - 🔒 **Mitigation**: Confirmation emails sent for all changes

2. **In-Memory Rate Limiting**: 
   - ⚠️ **Con**: Resets on server restart, not shared across instances
   - 🔄 **Future**: Upgrade to Redis-based rate limiting for production scale

3. **No CAPTCHA**: 
   - ⚠️ **Con**: Vulnerable to automated attacks
   - 🔄 **Future**: Add CAPTCHA for search and manage pages

---

## 🚀 Recommended Improvements

### Short Term
1. Add CAPTCHA to search and verification forms
2. Implement email verification codes (6-digit OTP)
3. Add audit logs for all booking modifications

### Medium Term
1. Upgrade to Redis-based rate limiting
2. Implement session tokens for verified users
3. Add two-factor authentication option

### Long Term
1. Implement OAuth login (Google, Facebook)
2. Add account creation system
3. Implement role-based access control (RBAC)

---

## 📋 Security Checklist

- ✅ Email verification required for all sensitive operations
- ✅ Rate limiting on search endpoint
- ✅ No sensitive data in console logs (production)
- ✅ Environment variables for all credentials
- ✅ Input validation on all API endpoints
- ✅ HTTPS enforced (Vercel default)
- ✅ CORS restrictions (same-origin policy)
- ✅ No SQL injection risk (using Notion API)
- ✅ XSS prevention (React auto-escaping)

---

## 🔍 Monitoring

### What to Monitor
- Failed authentication attempts (wrong email)
- Rate limit violations
- Unusual search patterns
- Multiple booking cancellations from same IP

### Alerting
Configure alerts for:
- >50 failed verifications per hour
- >100 rate limit violations per hour
- Multiple DELETE requests from same IP

---

## 📞 Security Contact

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email: [Your Security Email]
3. Include: Description, steps to reproduce, impact assessment

---

## 📄 Version History

- **v1.0** (Nov 2025): Initial security implementation
  - Email verification
  - Rate limiting
  - Data minimization
