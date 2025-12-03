# Availability & Services Sync Fixes

## Issues Fixed

### 1. Services Not Showing All Variants ✅
**Problem**: Only 1 "Family/Group Portraits" service was showing on the booking page, but there are 2 in Notion:
- Family/Group Portraits (3-5 Persons) - ₱1300
- Family/Group Portraits (6-16 Pax) - ₱1800

**Solution**: Updated `app/page.tsx` to include both service variants in:
- `SERVICE_HIERARCHY` - Added both variants to the Adult/Family Shoot group
- `SERVICE_INFO` - Added separate entries with correct pricing

### 2. Availability Sync Flow
**Current Implementation**: The availability API already implements the correct 3-way sync flow:

```
Admin UI (Save Button)
    ↓
POST /api/admin/availability
    ↓
1. Save to Notion Database (Source of Truth)
    ↓
2. Sync to Google Calendar
    ↓
3. Link Calendar Event ID back to Notion
```

## How It Works

### GET Endpoint (`/api/admin/availability`)
- Fetches blocked dates from Notion (source of truth)
- Returns availability schedule + blocked dates
- Falls back to defaults if Notion not configured

### POST Endpoint (`/api/admin/availability`)
- Receives availability data from Admin UI
- For each blocked date:
  1. **Create/Update in Notion** with all details
  2. **Create/Update in Google Calendar** with opaque transparency (blocks time)
  3. **Link** Calendar Event ID back to Notion record
- Handles deletions by archiving Notion records and deleting calendar events

## Environment Variables Required

### Production (Vercel)
Add these to your Vercel Environment Variables:

```bash
# Notion Configuration
NOTION_API_KEY=your_notion_integration_key
NOTION_AVAILABILITY_DATABASE_ID=2be64db3-ff08-80b1-bd46-e7a62babad8c
NOTION_SERVICES_DATABASE_ID=29664db3-ff08-8076-ae31-fec02c740116

# Google Calendar
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
GOOGLE_CALENDAR_ID=primary
```

### Local Development (.env.local)
Ensure your `.env.local` has:
```bash
NOTION_AVAILABILITY_DATABASE_ID=2be64db3-ff08-80b1-bd46-e7a62babad8c
```

## Testing Availability Sync

### 1. Test in Admin Panel
1. Go to `/admin/availability`
2. Add a blocked date (e.g., "Studio Closed")
3. Click "Save Availability"
4. Check logs for:
   ```
   [Availability API] ✅ Created in Notion: <block-id>
   [Availability API] ✅ Created in Calendar: <block-id>
   [Availability API] ✅ Linked Calendar Event ID in Notion
   ```

### 2. Verify in Notion
- Open your Notion Availability Database
- Check for new entry with:
  - Name/Reason
  - Start Date / End Date
  - Calendar Event ID (should be populated)
  - Status = Active

### 3. Verify in Google Calendar
- Open your Google Calendar
- Look for event: `🚫 [Studio Blocked] <reason>`
- Event should be:
  - Color: Red (colorId: '11')
  - Transparency: Opaque (shows as "Busy")
  - Blocks booking times

## Troubleshooting

### Availability Not Saving
1. **Check Vercel Environment Variables**
   - Ensure `NOTION_AVAILABILITY_DATABASE_ID` is set
   - Redeploy after adding variables

2. **Check Notion Permissions**
   ```bash
   node test-notion-connection.js
   ```
   Should show "✅ Connection successful!"

3. **Check Build Logs**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Check latest deployment logs for errors

### Services Not Pulling from Notion
1. **Verify Services Database ID**
   ```bash
   node check-services-details.js
   ```
   
2. **Check API Response**
   - Navigate to `/api/admin/services/config`
   - Should return all enabled services from Notion
   - Each service should have `id`, `name`, `basePrice`, etc.

3. **Clear Cache**
   - The services endpoint has `cache: 'no-store'` and `revalidate: 0`
   - Force refresh: Ctrl+Shift+R (hard reload)

## Next Steps

1. ✅ Services display fix - Deployed in commit `4df0295`
2. ⏳ Availability sync - Verify `NOTION_AVAILABILITY_DATABASE_ID` is in Vercel
3. ⏳ Test availability blocking in production
4. ⏳ Verify Google Calendar shows blocked dates as "Busy"

## Important Notes

- **Notion is the source of truth** for both availability and services
- Google Calendar events are synced FROM Notion, not the other way around
- Blocked dates must have `transparency: 'opaque'` to actually block booking times
- The API handles both creation, updates, and deletions automatically
