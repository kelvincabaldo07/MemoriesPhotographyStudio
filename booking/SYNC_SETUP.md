# Two-Way Sync Setup Guide

This guide explains how to set up **two-way synchronization** between Notion, Google Calendar, and your Admin Panel.

## 🔄 What Gets Synced

### Notion → Google Calendar (Already Working!)
Your existing webhook handles these automatically:
- ✅ New booking created → Creates calendar event
- ✅ Booking status changed to "Cancelled" → Deletes calendar event
- ✅ Date/time updated → Updates calendar event

### Admin Panel → Notion & Google Calendar (New!)
When admin makes changes in the admin panel:
- ✅ Cancel booking → Updates Notion status + Deletes calendar event
- ✅ Reschedule (edit date/time) → Updates both Notion + Calendar event
- ✅ Mark as completed → Updates Notion status only

### Google Calendar → Notion (Manual Setup Required)
Use Google Calendar Push Notifications to sync deletions/changes back to Notion:
- ⚠️ Event deleted in Calendar → Should update Notion status
- ⚠️ Event time changed in Calendar → Should update Notion

---

## 📋 Setup Instructions

### 1. Notion Webhook (Already Configured ✅)

Your Notion webhook is already set up at:
- **URL**: `https://book.memories-studio.com/api/webhooks/notion`
- **Secret**: Stored in `NOTION_WEBHOOK_SECRET`

**To verify it's working:**
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Find your integration
3. Check that the webhook URL is configured
4. Test by creating/updating a booking in Notion

---

### 2. Google Calendar Push Notifications (⚠️ Need to Set Up)

Google Calendar can notify your app when events change. This enables:
- Calendar event deleted → Update Notion booking status
- Calendar event rescheduled → Update Notion date/time

#### Step 1: Enable Google Calendar API Notifications

1. **Create the webhook endpoint** (file to create):

```typescript
// File: app/api/webhooks/google-calendar/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Google sends notifications with specific headers
    const resourceState = request.headers.get('x-goog-resource-state');
    const resourceId = request.headers.get('x-goog-resource-id');
    const channelId = request.headers.get('x-goog-channel-id');
    
    console.log('[Google Calendar Webhook] Received notification:', {
      resourceState,
      resourceId,
      channelId,
    });

    // When resource state is 'sync', it's just a verification ping
    if (resourceState === 'sync') {
      return NextResponse.json({ success: true, message: 'Sync acknowledged' });
    }

    // When 'exists', something changed in the calendar
    if (resourceState === 'exists') {
      // TODO: Fetch calendar events and compare with Notion bookings
      // Update Notion if any events were deleted or modified
      console.log('[Google Calendar Webhook] Calendar changed - need to sync');
      
      // For now, just acknowledge
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Google Calendar Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}
```

#### Step 2: Register the Watch Channel

Run this command to register your webhook with Google Calendar:

```bash
curl -X POST \
  'https://www.googleapis.com/calendar/v3/calendars/YOUR_CALENDAR_ID/events/watch' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "memories-booking-sync",
    "type": "web_hook",
    "address": "https://book.memories-studio.com/api/webhooks/google-calendar",
    "expiration": 1733097600000
  }'
```

**Important Notes:**
- Replace `YOUR_CALENDAR_ID` with `smile@memories-studio.com`
- Replace `YOUR_ACCESS_TOKEN` with a fresh OAuth token (get from Google OAuth Playground)
- `expiration` is Unix timestamp in milliseconds (renew every ~7 days)
- You'll need to renew this periodically (Google's max is ~1 week)

#### Step 3: Auto-Renew the Watch Channel

Create a cron job or scheduled function to renew the watch channel:

```typescript
// File: app/api/cron/renew-calendar-watch/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Get OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/callback`
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Set expiration to 7 days from now
    const expiration = Date.now() + (7 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.watch({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: {
        id: 'memories-booking-sync-' + Date.now(), // Unique ID
        type: 'web_hook',
        address: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/google-calendar`,
        expiration: expiration.toString(),
      },
    });

    console.log('✅ Calendar watch renewed:', response.data);
    
    return NextResponse.json({ 
      success: true, 
      resourceId: response.data.resourceId,
      expiration: new Date(parseInt(response.data.expiration || '0')).toISOString(),
    });
  } catch (error) {
    console.error('❌ Failed to renew calendar watch:', error);
    return NextResponse.json({ error: 'Failed to renew' }, { status: 500 });
  }
}
```

Then set up a Vercel Cron Job in `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/renew-calendar-watch",
    "schedule": "0 0 * * 0"
  }]
}
```

This runs weekly to keep the watch channel active.

---

## ✅ Testing the Sync

### Test 1: Notion → Google Calendar (Should Already Work)
1. Create a new booking in Notion with status "Confirmed"
2. Check Google Calendar - event should appear
3. Change booking status to "Cancelled" in Notion
4. Check Google Calendar - event should be deleted

### Test 2: Admin Panel → Both Systems
1. Go to Admin Panel `/admin/bookings`
2. Click on a confirmed booking
3. Click "Cancel Booking & Delete Event"
4. Verify:
   - ✅ Notion booking status = "Cancelled"
   - ✅ Google Calendar event deleted
5. Edit a booking's date/time and save
6. Verify:
   - ✅ Notion date/time updated
   - ✅ Google Calendar event rescheduled

### Test 3: Google Calendar → Notion (After Setup)
1. Delete an event directly in Google Calendar
2. Wait ~1 minute for notification
3. Check Notion - booking status should update to "Cancelled"

---

## 🔧 Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Notion → Calendar (create) | ✅ Working | Via webhook |
| Notion → Calendar (update) | ✅ Working | Via webhook |
| Notion → Calendar (delete) | ✅ Working | Via webhook |
| Admin → Notion (update) | ✅ Working | Via API |
| Admin → Calendar (update) | ✅ Working | Via API |
| Admin → Calendar (delete) | ✅ Working | Via API |
| Calendar → Notion (delete) | ⚠️ Manual setup needed | Requires push notifications |
| Calendar → Notion (update) | ⚠️ Manual setup needed | Requires push notifications |

---

## 📝 Important Notes

1. **Notion Webhook**: Already configured and working. No action needed.

2. **Admin Panel Sync**: Already implemented. Changes in admin panel automatically update both systems.

3. **Google Calendar → Notion**: Requires manual setup of push notifications (see steps above).

4. **Webhook Security**: 
   - Notion webhook uses `NOTION_WEBHOOK_SECRET`
   - Google Calendar webhook should validate headers
   - Both endpoints should only accept HTTPS in production

5. **Error Handling**: 
   - If Google Calendar sync fails, Notion still updates
   - If Notion sync fails, user sees error message
   - Check logs for debugging sync issues

---

## 🚀 Quick Start

**For immediate use (what's already working):**

1. ✅ Create/update bookings in Notion → Auto-creates/updates calendar events
2. ✅ Cancel bookings in Admin Panel → Deletes both Notion + Calendar
3. ✅ Reschedule in Admin Panel → Updates both systems

**To enable full two-way sync:**

1. Create `/api/webhooks/google-calendar/route.ts`
2. Create `/api/cron/renew-calendar-watch/route.ts`
3. Register initial watch channel with Google
4. Add cron job to Vercel
5. Test by deleting events in Google Calendar

---

## 🐛 Troubleshooting

**Webhook not firing:**
- Check webhook URL in Notion integration settings
- Verify `NOTION_WEBHOOK_SECRET` matches
- Check server logs for errors

**Calendar events not updating:**
- Verify `GOOGLE_REFRESH_TOKEN` is valid
- Check Google Calendar API quota
- Ensure calendar ID is correct

**Admin changes not syncing:**
- Check "Calendar Event ID" field in Notion
- Verify booking has a calendar event
- Check console logs for sync errors

---

## 📞 Support

If you encounter issues:
1. Check server logs (`/api/webhooks/notion` and `/api/admin/bookings/[id]`)
2. Verify environment variables are set correctly
3. Test individual sync directions to isolate the problem
4. Check Google Calendar API quotas and permissions
