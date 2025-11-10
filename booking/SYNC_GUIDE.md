# Booking System Synchronization

This document explains how the booking system keeps Notion, Google Calendar, and the booking website in sync.

## System Architecture

```
┌─────────────────┐
│  Booking Page   │ ← Shows real-time availability from Google Calendar
└────────┬────────┘
         │
         ▼
┌─────────────────┐         ┌──────────────────┐
│  Notion DB      │ ◄─────► │ Google Calendar  │
│  (Source of     │  Sync   │ (Availability)   │
│   Truth)        │         │                  │
└─────────────────┘         └──────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────┐         ┌──────────────────┐
│  Email Alerts   │         │  Calendar Invite │
│  (SendGrid)     │         │  to Customer     │
└─────────────────┘         └──────────────────┘
```

## How It Works

### 1. Customer Makes Booking on Website
1. Customer selects date/time → **Checks Google Calendar** for availability
2. Customer completes booking → Creates entry in **Notion**
3. System automatically creates **Google Calendar event**
4. System sends **confirmation email** via SendGrid
5. Customer receives **Google Calendar invite**

### 2. Admin Adds/Edits Booking in Notion
Currently: Manual bookings in Notion don't automatically sync to Google Calendar.

**Solution**: Use the sync endpoint or webhook (see setup below).

### 3. Admin Edits Calendar Event
Calendar changes don't sync back to Notion automatically.

**Future Enhancement**: Two-way sync webhook needed.

---

## Current Status

### ✅ What's Working
- **Booking Page → Notion**: Creates booking record ✓
- **Booking Page → Google Calendar**: Creates calendar event ✓
- **Booking Page → Email**: Sends confirmation ✓
- **Google Calendar → Booking Page**: Real-time availability ✓

### ⚠️ What Needs Manual Sync
- **Notion → Google Calendar**: Manual bookings in Notion don't auto-create calendar events
- **Google Calendar → Notion**: Manual calendar events don't create Notion records
- **Notion Edits → Google Calendar**: Changes to time/date in Notion don't update calendar
- **Notion Cancellation → Google Calendar**: Cancelled bookings don't delete calendar events

---

## Setup Guide

### Option 1: Manual Sync (Recommended for Now)

Run this whenever you manually add/edit bookings in Notion:

1. Open your browser
2. Navigate to: `https://book.memories-studio.com/api/admin/sync`
3. Use POST request (via Postman or curl):
   ```bash
   curl -X POST https://book.memories-studio.com/api/admin/sync
   ```
4. Response will show:
   ```json
   {
     "success": true,
     "summary": {
       "total": 45,
       "created": 3,
       "updated": 0,
       "skipped": 42,
       "errors": 0
     }
   }
   ```

**When to run this:**
- After manually adding bookings to Notion
- Once per day to ensure everything is synced
- After making bulk changes to the Notion database

### Option 2: Notion Webhook (Automatic Sync)

⚠️ **Note**: Notion webhooks require paid Notion plan.

1. **Add Webhook Secret to Environment Variables**
   ```
   NOTION_WEBHOOK_SECRET=your-secure-random-string-here
   ```

2. **Configure Notion Integration**
   - Go to [Notion Integrations](https://www.notion.so/my-integrations)
   - Select your integration
   - Add webhook URL: `https://book.memories-studio.com/api/webhooks/notion`
   - Add webhook secret (same as above)
   - Subscribe to events: `page.created`, `page.updated`, `page.deleted`
   - Select database: Your Bookings database

3. **Test Webhook**
   - Create a test booking in Notion
   - Check terminal logs for webhook event
   - Verify calendar event was created

---

## Troubleshooting

### Problem: Time slots show as available but are booked in Notion

**Cause**: Bookings in Notion don't have Google Calendar events yet.

**Solution**: Run the sync endpoint:
```bash
curl -X POST https://book.memories-studio.com/api/admin/sync
```

### Problem: Manual calendar events block slots but don't show in Notion

**Cause**: Calendar events created directly in Google Calendar aren't synced to Notion.

**Solution**: 
- Always create bookings in Notion (preferred)
- Or manually add blocked time in both systems

### Problem: Cancelled bookings still block time slots

**Cause**: Calendar events weren't deleted when status changed to "Cancelled".

**Solution**:
1. Find calendar event ID in Notion (in "Calendar Event ID" column)
2. Manually delete event from Google Calendar, OR
3. Run sync endpoint (future enhancement will handle this automatically)

---

## Best Practices

### For Admins

1. **Always create bookings in Notion first**
   - System will auto-create calendar event
   - System will send confirmation email
   - Everything stays in sync

2. **Run daily sync**
   - Schedule a daily sync at 6 AM
   - Catches any manual additions
   - Ensures all systems are current

3. **Check calendar before manual booking**
   - Open Google Calendar
   - Verify time slot is actually free
   - Then create Notion entry

4. **Update cancellations properly**
   - Change Status to "Cancelled" in Notion
   - Delete corresponding Google Calendar event
   - (Future: Will be automatic with webhook)

### For Customers

1. **Always book through website**
   - Real-time availability
   - Instant confirmation
   - Automatic calendar invite

2. **Use manage booking link**
   - Reschedule/cancel through link in email
   - Changes sync automatically
   - Updates calendar and sends notifications

---

## Environment Variables Required

```env
# Google Calendar
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_CALENDAR_ID=your-calendar-id

# Notion
NOTION_API_KEY=secret_xxxx
NOTION_BOOKINGS_DATABASE_ID=xxxx
NOTION_WEBHOOK_SECRET=your-webhook-secret (optional, for automatic sync)

# SendGrid
SENDGRID_API_KEY=SG.xxxx
SENDGRID_FROM_EMAIL=smile@memories-studio.com
```

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Booking page checks Google Calendar availability
- ✅ New bookings create calendar events
- ✅ Manual sync endpoint available

### Phase 2 (Planned)
- 🔄 Notion webhook auto-syncs on changes
- 🔄 Status changes auto-update calendar
- 🔄 Cancellations auto-delete events

### Phase 3 (Future)
- 📧 Update emails when bookings change
- 🔄 Two-way sync: Calendar → Notion
- 📊 Sync status dashboard in admin panel
- ⏰ Automatic daily sync cron job

---

## API Endpoints

### GET /api/calendar/availability
Checks real-time availability for a date.
```
GET /api/calendar/availability?date=2025-11-15&duration=60
```

### POST /api/calendar/availability-batch
Checks availability for multiple dates at once.
```
POST /api/calendar/availability-batch
Body: { "dates": ["2025-11-15", "2025-11-16"], "duration": 60 }
```

### POST /api/admin/sync
Manually syncs all Notion bookings to Google Calendar.
```
POST /api/admin/sync
```

### POST /api/webhooks/notion
Receives Notion webhook events (automatic sync).
```
POST /api/webhooks/notion
Header: Authorization: Bearer your-webhook-secret
```

---

## Questions?

Contact the development team or check the main README.md for more information.
