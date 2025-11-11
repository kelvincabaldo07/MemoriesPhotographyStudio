# Booking Settings Database Setup

This guide explains how to set up the Notion Settings database for configurable booking policies.

## Overview

The booking settings system allows admin users to configure booking policies through the admin dashboard:
- **Lead Time**: Minimum notice required before booking (hours/minutes)
- **Booking Slot Size**: Time increments for available slots (minutes)
- **Scheduling Window**: How many days in advance customers can book (days)
- **Cancellation Policy**: Minimum time before appointment for cancellation (hours/days)

## Prerequisites

- Notion workspace with API access
- Notion integration token (same as used for bookings database)
- Admin dashboard access

## Setup Steps

### 1. Create Notion Database

1. Go to your Notion workspace
2. Create a new database named "**Settings**" (or similar)
3. Configure the following properties:

| Property Name | Property Type | Options |
|--------------|---------------|---------|
| Name | Title | (default) |
| Setting Type | Select | Options: "Booking Policies", "Email Templates", "Service Config" |
| Lead Time | Number | - |
| Lead Time Unit | Select | Options: "hours", "minutes" |
| Booking Slot Size | Number | - |
| Scheduling Window | Number | - |
| Cancellation Policy | Number | - |
| Cancellation Policy Unit | Select | Options: "hours", "days" |

### 2. Get Database ID

1. Open your Settings database in Notion
2. Click "Share" → "Copy link"
3. Extract the database ID from the URL:
   ```
   https://www.notion.so/{workspace}/{DATABASE_ID}?v={view_id}
   ```
4. Copy the `DATABASE_ID` (32-character alphanumeric string)

### 3. Add Environment Variable

Add the database ID to your `.env.local` file:

```bash
NOTION_SETTINGS_DATABASE_ID=your_database_id_here
```

### 4. Grant Integration Access

1. In your Settings database, click the "..." menu (top right)
2. Select "Connections" → "Connect to"
3. Select your Notion integration

### 5. Create Initial Settings (Optional)

You can manually create a "Booking Policies" page in your Settings database with default values:

- **Name**: "Booking Policies"
- **Setting Type**: "Booking Policies"
- **Lead Time**: 2
- **Lead Time Unit**: hours
- **Booking Slot Size**: 15
- **Scheduling Window**: 90
- **Cancellation Policy**: 2
- **Cancellation Policy Unit**: hours

**Note**: If no settings exist, the system will use these defaults automatically.

## Usage

### Admin Dashboard

1. Log in to the admin dashboard at `/admin/login`
2. Navigate to **Settings** page
3. Scroll to **Booking Policies** section
4. Adjust any policy values
5. Click "**Save Changes**"
6. Settings take effect immediately for all new bookings

### API Endpoints

The system provides two API endpoints:

**Admin Endpoint** (requires authentication):
```
GET/POST /api/admin/booking-settings
```

**Public Endpoint** (no auth required):
```
GET /api/booking-settings
```

Both endpoints return the same structure:
```json
{
  "leadTime": 2,
  "leadTimeUnit": "hours",
  "bookingSlotSize": 15,
  "schedulingWindow": 90,
  "cancellationPolicy": 2,
  "cancellationPolicyUnit": "hours"
}
```

## How It Works

1. **Frontend**: Booking form fetches settings from `/api/booking-settings` on mount
2. **Availability API**: Dynamically uses lead time and slot size for availability calculations
3. **Calendar Generation**: Uses scheduling window to determine how far ahead customers can book
4. **Admin UI**: Saves changes to Notion Settings database via `/api/admin/booking-settings`

## Default Values

If the Settings database is not configured or empty, the system uses these defaults:

- Lead Time: **2 hours**
- Booking Slot Size: **15 minutes**
- Scheduling Window: **90 days**
- Cancellation Policy: **2 hours**

## Troubleshooting

### Settings not loading
1. Check that `NOTION_SETTINGS_DATABASE_ID` is set in `.env.local`
2. Verify the integration has access to the Settings database
3. Check server logs for Notion API errors
4. Ensure database properties match exactly (case-sensitive)

### Changes not applying
1. Refresh the booking form page (settings are loaded on mount)
2. Check browser console for API errors
3. Verify the admin save operation succeeded (check server logs)

### Database not found error
- Make sure you're using the correct database ID (not page ID)
- Ensure the database is shared with your Notion integration
- Try reconnecting the integration to the database

## Related Documentation

- [NOTION_SETUP.md](./NOTION_SETUP.md) - General Notion setup guide
- [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) - Complete setup checklist
- [SERVICES_DATABASE_SETUP.md](./SERVICES_DATABASE_SETUP.md) - Services configuration

## Future Enhancements

Potential additions to booking settings:
- Business hours customization
- Buffer time between sessions
- Maximum advance booking limit
- Seasonal pricing adjustments
- Custom email templates per service type
