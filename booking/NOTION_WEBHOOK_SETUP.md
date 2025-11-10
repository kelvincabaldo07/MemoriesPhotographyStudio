# Notion Webhook Setup Guide

## Step 1: Add Environment Variable to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project: `MemoriesPhotographyStudio`
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `NOTION_WEBHOOK_SECRET`
   - **Value**: `a0c0b6463782fb04c890a211084cfc7ae17879b6780c9e3b9f32b73275ad13ab`
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your app for changes to take effect

---

## Step 2: Configure Notion Webhook

### A. Go to Notion Webhook Settings
1. Visit: https://developers.notion.com/reference/webhooks
2. Or go to: https://www.notion.so/my-integrations
3. Select your integration: **Memories Photography Studio**
4. Click **Create subscription** (or **Webhooks** tab)

### B. Configure Webhook Subscription

#### **Webhook URL**:
```
https://book.memories-studio.com/api/webhooks/notion
```
☝️ This is your webhook endpoint (must be public and SSL-enabled)

#### **API Version**:
Select: `2022-06-28` (or latest stable version)

#### **Events to Listen To** (Select these 3):
- ☑️ **page.created** - When new booking is added
- ☑️ **page.updated** - When booking is modified
- ☑️ **page.deleted** - When booking is deleted

#### **Database Filter**:
- Select: **Bookings database** (29664db3ff08802b8412d121fadb9255)
- This ensures webhook only triggers for booking-related changes

#### **Webhook Secret** (if asked):
```
Bearer a0c0b6463782fb04c890a211084cfc7ae17879b6780c9e3b9f32b73275ad13ab
```
☝️ Use this as Authorization header

---

## Step 3: Test the Webhook

### A. Create Test Booking in Notion
1. Open your Bookings database in Notion
2. Add a new manual booking:
   - **Booking ID**: TEST-2025111001
   - **Status**: Confirmed
   - **First Name**: Test
   - **Last Name**: User
   - **Email**: test@example.com
   - **Service**: Solo/Duo 30
   - **Duration**: 30
   - **Date**: Tomorrow
   - **Time**: 10:00

### B. Verify Webhook Triggered
1. Check Vercel logs: https://vercel.com/dashboard
2. Look for: `[Notion Webhook] Received event: page.created`
3. Should see: `[Notion Webhook] Creating Google Calendar event`
4. Should see: `✅ Calendar event created: [event-id]`

### C. Check Calendar Event Created
1. Open Google Calendar: https://calendar.google.com
2. Check tomorrow at 10:00 AM
3. Should see event: "📸 Solo/Duo 30 - Test User"

### D. Verify Notion Updated
1. Go back to your test booking in Notion
2. Check **Calendar Event ID** column
3. Should now have the Google Calendar event ID

---

## Step 4: Test Booking Update

1. In Notion, change the test booking:
   - Change **Time** from 10:00 to 11:00
   - Or change **Date** to different day

2. Verify webhook triggered:
   - Check Vercel logs for `page.updated` event
   - Should see calendar event update

3. Check Google Calendar:
   - Event should now be at 11:00 (or new date)

---

## Step 5: Test Cancellation

1. In Notion, update test booking:
   - Change **Status** to "Cancelled"

2. Verify webhook triggered:
   - Check Vercel logs for `page.updated` event
   - Should see: `Deleting calendar event for cancelled booking`

3. Check Google Calendar:
   - Event should be deleted

---

## Troubleshooting

### Webhook Not Triggering
**Check:**
- ✓ `NOTION_WEBHOOK_SECRET` added to Vercel environment variables
- ✓ App redeployed after adding variable
- ✓ Webhook URL is correct: `https://book.memories-studio.com/api/webhooks/notion`
- ✓ Webhook is subscribed to correct database
- ✓ Events selected: page.created, page.updated, page.deleted

**Test manually:**
```bash
curl -X POST https://book.memories-studio.com/api/webhooks/notion \
  -H "Authorization: Bearer a0c0b6463782fb04c890a211084cfc7ae17879b6780c9e3b9f32b73275ad13ab" \
  -H "Content-Type: application/json" \
  -d '{"object":"page","event":"page.created","data":{"id":"test"}}'
```

### Calendar Event Not Created
**Check:**
- ✓ Booking has all required fields (Email, Date, Time)
- ✓ Status is "Confirmed"
- ✓ Google Calendar integration is working
- ✓ Vercel logs for error messages

### Notion Not Updating with Calendar Event ID
**Check:**
- ✓ Column exists in Notion: "Calendar Event ID" (rich_text type)
- ✓ Notion API has write permissions
- ✓ Vercel logs show successful update

---

## What Happens Now (Automatic)

### When You Add Booking in Notion:
1. ✅ Webhook triggers automatically
2. ✅ Creates Google Calendar event
3. ✅ Updates Notion with Calendar Event ID
4. ✅ Time slot blocked on booking website

### When You Update Booking:
1. ✅ Webhook triggers automatically
2. ✅ Updates Google Calendar event
3. ✅ Sends notification email (TODO)
4. ✅ Availability updates on website

### When You Cancel Booking:
1. ✅ Webhook triggers automatically
2. ✅ Deletes Google Calendar event
3. ✅ Time slot becomes available again

---

## Webhook Payload Examples

### page.created Event
```json
{
  "object": "page",
  "event": "page.created",
  "data": {
    "id": "page-id-here",
    "properties": {
      "Booking ID": { "title": [{ "plain_text": "MMRS-2025111001" }] },
      "Status": { "select": { "name": "Confirmed" } },
      "First Name": { "rich_text": [{ "plain_text": "John" }] },
      "Last Name": { "rich_text": [{ "plain_text": "Doe" }] },
      "Email": { "email": "john@example.com" },
      "Service": { "select": { "name": "Solo/Duo 30" } },
      "Date": { "date": { "start": "2025-11-11" } },
      "Time": { "rich_text": [{ "plain_text": "10:00" }] }
    }
  }
}
```

### page.updated Event
```json
{
  "object": "page",
  "event": "page.updated",
  "data": {
    "id": "page-id-here",
    "properties": {
      "Status": { "select": { "name": "Cancelled" } }
    }
  }
}
```

---

## Security Notes

- ✅ Webhook URL is public but requires secret token
- ✅ All requests must include `Authorization: Bearer [secret]` header
- ✅ Webhook only processes events from your Notion workspace
- ✅ Invalid requests return 401 Unauthorized

---

## Monitoring

### Check Webhook Status
- Notion dashboard: https://www.notion.so/my-integrations
- View webhook subscription
- See delivery history and success rate

### View Logs
- Vercel: https://vercel.com/dashboard → Runtime Logs
- Filter by: `/api/webhooks/notion`
- Look for success/error messages

---

## Alternative: Manual Sync

If you prefer not to use webhooks, you can still use:

### Option 1: Sync Button
- Admin Settings: https://book.memories-studio.com/admin/settings
- Click "Sync Now" button
- Run after manually adding bookings

### Option 2: API Endpoint
```bash
curl -X POST https://book.memories-studio.com/api/admin/sync
```

### Option 3: Daily Cron Job
- Set up Vercel Cron or external scheduler
- Call `/api/admin/sync` daily at 6 AM
- Ensures everything stays synced

---

## Complete! 🎉

Once set up, your system will be fully automated:
- Notion ↔ Google Calendar (automatic sync)
- Google Calendar → Booking Website (real-time availability)
- Any changes in Notion immediately update everywhere

No more manual syncing needed! 🚀
