# Audit Logging System

## Overview
A comprehensive audit logging system has been implemented to track all booking-related operations for security monitoring, compliance, and debugging. All actions are logged with detailed context including who, what, when, where, and why.

## Implementation Details

### 1. Audit Library (`lib/audit.ts`)
Core audit logging functionality with Notion database integration.

#### Functions:

**Core Logging:**
- **`logAudit(entry: AuditLogEntry)`**: Main logging function that writes to Notion and console
  - Writes to Notion Audit Logs database (if configured)
  - Falls back to console logging if database not available
  - Never throws errors (fail-safe design)

**Helper Functions:**
- **`getClientIP(request)`**: Extracts IP address from request headers
- **`getClientUserAgent(request)`**: Extracts user agent from request headers
- **`createBookingAudit()`**: Creates audit entry for new bookings
- **`createUpdateAudit()`**: Creates audit entry for booking updates
- **`createCancelAudit()`**: Creates audit entry for cancellations
- **`createViewAudit()`**: Creates audit entry for booking views
- **`createSearchAudit()`**: Creates audit entry for booking searches
- **`createOTPRequestAudit()`**: Creates audit entry for OTP requests
- **`createOTPVerifyAudit()`**: Creates audit entry for OTP verifications

#### Audit Log Entry Structure:
```typescript
{
  timestamp: string;           // ISO 8601 timestamp
  bookingId: string;           // Booking ID (or 'N/A' for searches)
  action: string;              // Action type (see below)
  email: string;               // User email
  ipAddress: string;           // Client IP address
  userAgent: string;           // Browser/client user agent
  changes?: Record<string, any>;  // What changed (for updates)
  metadata?: Record<string, any>; // Additional context
  status: 'success' | 'failure' | 'blocked';  // Outcome
  errorMessage?: string;       // Error details (if failed)
}
```

#### Action Types:
| Action | Description | When Logged |
|--------|-------------|-------------|
| `create` | New booking created | POST /api/bookings |
| `update` | Booking rescheduled | PUT /api/bookings/[id] |
| `cancel` | Booking cancelled | DELETE /api/bookings/[id] |
| `view` | Booking details accessed | GET /api/bookings/[id] |
| `search` | Bookings searched | GET /api/bookings |
| `otp_request` | OTP code requested | POST /api/otp/send |
| `otp_verify` | OTP code verified | POST /api/otp/verify |

#### Status Values:
- **`success`**: Operation completed successfully
- **`failure`**: Operation failed (invalid data, not found, etc.)
- **`blocked`**: Operation blocked by security measures (rate limit, reCAPTCHA)

### 2. Integration Points

#### GET `/api/bookings` (Search)
**Logged Events:**
- ✅ Successful search with results count
- ✅ Failed search with error details

**Example Log:**
```json
{
  "timestamp": "2024-11-09T14:30:00Z",
  "bookingId": "N/A",
  "action": "search",
  "email": "customer@example.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": { "resultsCount": 3 },
  "status": "success"
}
```

#### GET `/api/bookings/[id]` (View)
**Logged Events:**
- ✅ Successful view
- ✅ Failed view (not found, access denied)

**Example Log:**
```json
{
  "timestamp": "2024-11-09T14:35:00Z",
  "bookingId": "MMRS-2024110914-A3B7",
  "action": "view",
  "email": "customer@example.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "success"
}
```

#### PUT `/api/bookings/[id]` (Update)
**Logged Events:**
- ✅ Successful update with before/after values
- ✅ Failed update (not found, access denied)

**Example Log:**
```json
{
  "timestamp": "2024-11-09T14:40:00Z",
  "bookingId": "MMRS-2024110914-A3B7",
  "action": "update",
  "email": "customer@example.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "changes": {
    "date": { "from": "2024-11-10", "to": "2024-11-15" },
    "time": { "from": "14:00", "to": "16:00" }
  },
  "status": "success"
}
```

#### DELETE `/api/bookings/[id]` (Cancel)
**Logged Events:**
- ✅ Successful cancellation
- ✅ Failed cancellation (not found, access denied)

**Example Log:**
```json
{
  "timestamp": "2024-11-09T14:45:00Z",
  "bookingId": "MMRS-2024110914-A3B7",
  "action": "cancel",
  "email": "customer@example.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "success"
}
```

#### POST `/api/otp/send` (Request OTP)
**Logged Events:**
- ✅ Successful OTP generation
- ✅ Failed request (booking not found, email mismatch)
- ✅ Blocked by rate limiting
- ✅ Blocked by reCAPTCHA

**Example Log:**
```json
{
  "timestamp": "2024-11-09T14:50:00Z",
  "bookingId": "MMRS-2024110914-A3B7",
  "action": "otp_request",
  "email": "customer@example.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "status": "success"
}
```

**Example Blocked Log:**
```json
{
  "timestamp": "2024-11-09T14:51:00Z",
  "bookingId": "MMRS-2024110914-A3B7",
  "action": "otp_request",
  "email": "attacker@evil.com",
  "ipAddress": "192.168.1.100",
  "userAgent": "Python-requests/2.28.0",
  "status": "blocked",
  "errorMessage": "Rate limit exceeded"
}
```

#### POST `/api/otp/verify` (Verify OTP)
**Logged Events:**
- ✅ Successful verification
- ✅ Failed verification with attempts remaining
- ✅ System errors

**Example Log:**
```json
{
  "timestamp": "2024-11-09T14:52:00Z",
  "bookingId": "MMRS-2024110914-A3B7",
  "action": "otp_verify",
  "email": "customer@example.com",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "metadata": { "attemptsRemaining": 4 },
  "status": "failure",
  "errorMessage": "Invalid code. 4 attempts remaining."
}
```

## Notion Database Setup

### Creating the Audit Logs Database

1. **Create new database in Notion**
   - Name: "Audit Logs" or "Booking Audit Trail"
   
2. **Add required properties:**

| Property Name | Type | Description |
|--------------|------|-------------|
| Timestamp | Date | When the action occurred |
| Booking ID | Text | Related booking ID |
| Action | Select | Type of action (create, update, cancel, view, search, otp_request, otp_verify) |
| Email | Email | User's email address |
| IP Address | Text | Client IP address |
| User Agent | Text | Browser/client identifier |
| Changes | Text | JSON of what changed |
| Metadata | Text | Additional context (JSON) |
| Status | Select | Outcome (success, failure, blocked) |
| Error Message | Text | Error details (if applicable) |

3. **Configure Select options:**

**Action:**
- create
- update
- cancel
- view
- search
- otp_request
- otp_verify

**Status:**
- success (green)
- failure (yellow)
- blocked (red)

4. **Get database ID:**
   - Open database in Notion
   - Copy the URL: `https://notion.so/workspace/<DATABASE_ID>?v=...`
   - Extract `<DATABASE_ID>` (32-character hex string)

5. **Update `.env.local`:**
   ```bash
   NOTION_AUDIT_LOGS_DATABASE_ID=your_database_id_here
   ```

### Database Views

**Recommended views in Notion:**

1. **Recent Activity** (default)
   - Sort by: Timestamp (descending)
   - Show all entries

2. **Failed Attempts**
   - Filter: Status = failure OR Status = blocked
   - Sort by: Timestamp (descending)
   - Useful for security monitoring

3. **By Action**
   - Group by: Action
   - Sort by: Timestamp (descending)
   - Useful for analyzing patterns

4. **By User**
   - Group by: Email
   - Sort by: Timestamp (descending)
   - Useful for user activity tracking

5. **Security Events**
   - Filter: Status = blocked
   - Sort by: Timestamp (descending)
   - Critical for security monitoring

## Security Features

### What Gets Logged

**Always Logged:**
- ✅ Timestamp (ISO 8601)
- ✅ Booking ID (or 'N/A')
- ✅ Action type
- ✅ User email
- ✅ IP address
- ✅ User agent
- ✅ Operation status

**Conditionally Logged:**
- ✅ Changes (for updates: before/after values)
- ✅ Metadata (e.g., results count, attempts remaining)
- ✅ Error messages (for failures)

**Never Logged:**
- ❌ Passwords (none used)
- ❌ OTP codes
- ❌ Full payment details (none collected)
- ❌ Sensitive personal data beyond email

### Fail-Safe Design

The audit logging system is designed to never break main functionality:

```typescript
try {
  await logAudit(entry);
} catch (error) {
  console.error('[AUDIT] Logging failed:', error);
  // Continue with main operation
}
```

- If Notion is down: Logs to console
- If database not configured: Logs to console
- If logging fails: Main operation continues
- Always returns immediately (non-blocking)

### Console Fallback

When Notion database is not configured:

```
[AUDIT] INFO create by customer@example.com from 192.168.1.1 - success
[AUDIT] WARN Notion audit logs database not configured. Logging to console only.
[AUDIT] Entry: { timestamp: "2024-11-09T14:30:00Z", ... }
```

## Use Cases

### 1. Security Monitoring

**Detect suspicious activity:**
- Multiple failed verification attempts from same IP
- Rate limiting triggers
- reCAPTCHA failures
- Access attempts with mismatched emails

**Query Examples:**
```
# Find all blocked attempts
Filter: Status = "blocked"

# Find multiple failures from same IP
Group by: IP Address
Filter: Status = "failure"
Sort by: Count (descending)
```

### 2. Compliance & Auditing

**Track all data access:**
- Who viewed which bookings
- When bookings were modified
- What changes were made
- Why operations failed

**Regulatory Requirements:**
- GDPR: Right to know who accessed personal data
- PCI DSS: Audit trail of all transactions
- HIPAA: Access logs for protected information

### 3. Debugging & Support

**Investigate customer issues:**
- "Why didn't my booking update?"
  - Check audit logs for failures
  - See exact error message
  - Verify email used

- "I never received my OTP"
  - Check if OTP was requested
  - Verify booking ID and email match
  - Check for rate limiting

### 4. Analytics

**Understand usage patterns:**
- Most common actions
- Peak activity times
- Success vs failure rates
- Geographic distribution (IP addresses)

## Testing

### Development Testing

**Console logging (without Notion):**
```bash
# Start dev server
npm run dev

# Perform actions
# Check terminal for logs:
[AUDIT] INFO view by test@example.com from 127.0.0.1 - success
```

**Notion logging (with database):**
1. Create audit logs database in Notion
2. Add `NOTION_AUDIT_LOGS_DATABASE_ID` to `.env.local`
3. Restart server
4. Perform actions
5. Check Notion database for entries

### Test Scenarios

**1. Successful Booking View:**
```bash
# Should log: action=view, status=success
GET /api/bookings/MMRS-2024110914-A3B7?email=test@example.com
```

**2. Failed Booking View:**
```bash
# Should log: action=view, status=failure
GET /api/bookings/MMRS-2024110914-A3B7?email=wrong@example.com
```

**3. Booking Update:**
```bash
# Should log: action=update, status=success, with changes
PUT /api/bookings/MMRS-2024110914-A3B7
Body: { email: "test@example.com", updates: { date: "2024-11-15" } }
```

**4. Rate Limit Trigger:**
```bash
# Should log: action=otp_request, status=blocked
# Send 4 OTP requests within 1 minute
POST /api/otp/send (repeat 4 times quickly)
```

**5. Invalid OTP:**
```bash
# Should log: action=otp_verify, status=failure, attemptsRemaining=4
POST /api/otp/verify
Body: { email: "test@example.com", bookingId: "ABC123", code: "000000" }
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Failed Authentication Rate**
   - Threshold: > 10% failure rate
   - Action: Investigate for attacks

2. **Blocked Attempts**
   - Threshold: > 5 blocked per IP per hour
   - Action: Consider IP ban

3. **OTP Failure Rate**
   - Threshold: > 30% failure rate
   - Action: Check email delivery

4. **Unusual Activity Patterns**
   - Multiple emails from single IP
   - Rapid succession of requests
   - Unusual user agents (bots)

### Setting Up Alerts (Future)

**Option 1: Notion Automations**
- Trigger on new entry with Status = "blocked"
- Send notification to Slack/email

**Option 2: External Monitoring**
- Query Notion API periodically
- Analyze patterns
- Send alerts for anomalies

**Option 3: Real-time Webhooks**
- Send audit events to monitoring service
- Real-time alerting
- Dashboard visualization

## Performance Considerations

### Current Implementation

- **Async logging**: Doesn't block main operations
- **Fail-safe**: Errors caught and handled
- **Lightweight**: Minimal data processing
- **Console fallback**: Always available

### Optimization Tips

1. **Batch Writes** (future):
   ```typescript
   // Instead of writing one-by-one
   await Promise.all(entries.map(entry => logAudit(entry)));
   ```

2. **Queue System** (future):
   ```typescript
   // Queue logs and flush periodically
   auditQueue.push(entry);
   setInterval(() => flushAuditQueue(), 5000);
   ```

3. **Database Indexing**:
   - Index Timestamp for fast queries
   - Index Email for user lookups
   - Index IP Address for security analysis

## Privacy & Data Retention

### Data Collected

**Personal Data:**
- Email address
- IP address (can identify individuals)
- Timestamps (activity patterns)

**Non-Personal Data:**
- Booking IDs
- Action types
- Error messages
- User agents

### Compliance

**GDPR Requirements:**
- ✅ Legitimate interest: Security and fraud prevention
- ✅ Data minimization: Only essential data logged
- ✅ Transparency: Users informed in privacy policy
- ⚠️ Right to erasure: Manual deletion required
- ⚠️ Data retention: No auto-deletion configured

**Recommendations:**
1. Update privacy policy to mention audit logging
2. Implement data retention policy (e.g., 90 days)
3. Provide audit log access to users (their data only)
4. Automated deletion after retention period

### Data Retention Policy (Recommended)

```typescript
// Future: Implement automated cleanup
async function cleanupOldAuditLogs(daysToKeep: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  // Delete logs older than cutoffDate
  // Implementation depends on Notion API capabilities
}
```

## Known Limitations

### Current Implementation
- ✅ Logs all booking operations
- ✅ Captures IP and user agent
- ✅ Tracks success/failure/blocked
- ✅ Console fallback
- ✅ Fail-safe design
- ❌ No batch writes (one-by-one)
- ❌ No automated data retention
- ❌ No real-time alerts
- ❌ No admin dashboard view
- ❌ No audit log export feature

### Future Enhancements

1. **Admin Dashboard**
   - View recent audit logs
   - Filter by user, action, status
   - Export to CSV
   - Real-time updates

2. **Advanced Analytics**
   - User activity heatmaps
   - Geographic distribution maps
   - Anomaly detection
   - Trend analysis

3. **Automated Cleanup**
   - Configurable retention period
   - Archive old logs
   - Compliance with data laws

4. **Real-time Monitoring**
   - Live dashboard
   - Instant alerts
   - Integration with Datadog/Sentry
   - Slack notifications

## Integration Checklist

- [x] Created audit utility library (`lib/audit.ts`)
- [x] Integrated into GET /api/bookings (search)
- [x] Integrated into GET /api/bookings/[id] (view)
- [x] Integrated into PUT /api/bookings/[id] (update)
- [x] Integrated into DELETE /api/bookings/[id] (cancel)
- [x] Integrated into POST /api/otp/send (OTP request)
- [x] Integrated into POST /api/otp/verify (OTP verify)
- [x] Added console logging fallback
- [x] Fail-safe error handling
- [x] Environment variable for database ID
- [x] Documented implementation
- [ ] **User Action Required**: Create Notion audit logs database
- [ ] **User Action Required**: Configure database ID in .env.local
- [ ] **Future**: Create admin dashboard for viewing logs
- [ ] **Future**: Implement data retention policy
- [ ] **Future**: Set up monitoring alerts

## Next Steps

1. **Create Notion Audit Logs Database:**
   - Follow database setup instructions above
   - Add all required properties
   - Configure select options
   - Get database ID

2. **Update Environment Variable:**
   ```bash
   NOTION_AUDIT_LOGS_DATABASE_ID=your_database_id_here
   ```

3. **Test Logging:**
   - Restart development server
   - Perform various actions
   - Check Notion database for entries
   - Verify all fields populated correctly

4. **Monitor in Production:**
   - Check logs daily for suspicious activity
   - Review failed attempts
   - Track usage patterns
   - Adjust security measures as needed

5. **Plan Future Improvements:**
   - Admin dashboard
   - Automated alerts
   - Data retention
   - Advanced analytics

---

**Status**: ✅ Implementation Complete | 📊 Awaiting Notion Database Setup
