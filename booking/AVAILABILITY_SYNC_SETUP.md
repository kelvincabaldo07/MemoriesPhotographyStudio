# 🔄 Availability 3-Way Sync Setup Guide

This guide helps you set up a 3-way sync system between:
- **Admin UI** (web interface)
- **Notion Database** (source of truth)
- **Google Calendar** (visual representation)

## 📋 Prerequisites

- Notion API integration token
- Google Calendar API credentials
- Admin access to your booking system

## 🗄️ Step 1: Create Notion Availability Database

1. **Create a new database in Notion** with the following properties:

| Property Name | Type | Description |
|--------------|------|-------------|
| Name | Title | Name/reason for the block |
| Block ID | Text | Unique identifier (auto-generated) |
| Start Date | Date | Starting date of the block |
| End Date | Date | Ending date of the block |
| All Day | Checkbox | Whether it's an all-day block |
| Start Time | Text | Start time (HH:MM format) if not all-day |
| End Time | Text | End time (HH:MM format) if not all-day |
| Reason | Text | Optional description |
| Calendar Event ID | Text | Google Calendar event ID (auto-synced) |
| Status | Select | Active, Archived |
| Created | Created time | Auto-generated |
| Last Synced | Date | Last sync timestamp |

2. **Get your database ID:**
   - Open the database in Notion
   - Copy the URL: `https://notion.so/workspace/DATABASE_ID?v=...`
   - The DATABASE_ID is the 32-character string before `?v=`

3. **Add to your `.env.local`:**
```env
NOTION_AVAILABILITY_DATABASE_ID=your_database_id_here
```

## 🔧 Step 2: Update Environment Variables

Ensure your `.env.local` has:
```env
# Existing
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_bookings_database_id
NOTION_SERVICES_DATABASE_ID=your_services_database_id

# New - Add this
NOTION_AVAILABILITY_DATABASE_ID=your_availability_database_id
```

## 🎯 Step 3: How the Sync Works

### Adding a Blocked Date in Admin UI:
1. Go to `/admin/availability`
2. Add a blocked date with date range and reason
3. Click "Save & Sync"
4. System will:
   - ✅ Save to Notion Availability Database
   - ✅ Create/update Google Calendar event
   - ✅ Store the Calendar Event ID back in Notion

### Adding a Blocked Date in Notion:
1. Manually add a row in Notion Availability Database
2. Fill in: Name, Start Date, End Date, All Day, etc.
3. Leave "Calendar Event ID" empty
4. Run sync from Admin UI or wait for auto-sync
5. System will create the Google Calendar event and update Notion

### Adding a Blocked Date in Google Calendar:
1. Create an event with `[Studio Blocked]` in the title
2. Run sync from Admin UI
3. System will import it to Notion

## 🔄 Sync Directions

```
┌─────────────┐
│  Admin UI   │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌─────────────┐
│   Notion    │◄─┤   Google    │
│  Database   │──┤  Calendar   │
└─────────────┘  └─────────────┘
```

- **Admin UI → Notion → Google Calendar** (primary flow)
- **Notion → Google Calendar** (manual adds in Notion)
- **Google Calendar → Notion** (import from calendar)

## 🚀 Testing

After setup, test the sync:

```bash
cd booking
node test-availability-sync.js
```

This will verify all three systems are properly connected.
