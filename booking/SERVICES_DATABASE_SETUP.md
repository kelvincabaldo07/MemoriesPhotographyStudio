# Services Database Setup

## Notion Database Structure

To enable service management with Notion storage, create a new Notion database with the following properties:

### Required Properties

| Property Name | Type | Configuration |
|--------------|------|---------------|
| **Name** | Title | Service name (e.g., "Solo/Duo 30") |
| **Type** | Select | Options: "Self-Shoot", "With Photographer", "Seasonal Sessions" |
| **Group** | Text | Group name (e.g., "Solo/Duo", "Small Group") |
| **Description** | Text | Service details and inclusions |
| **BasePrice** | Number | Base price in PHP (e.g., 400) |
| **Duration** | Number | Duration in minutes (e.g., 30) |
| **Enabled** | Checkbox | Whether service is active (checked = enabled) |

### Optional Properties

| Property Name | Type | Configuration |
|--------------|------|---------------|
| **Category** | Select | Options: "Classic", "Digital" |
| **AvailableFrom** | Number | Hour in 24h format (e.g., 8 for 8:00 AM) |
| **AvailableUntil** | Number | Hour in 24h format (e.g., 18 for 6:00 PM) |
| **ClassicPrice** | Number | Override classic pricing if different from basePrice + 50 |
| **Thumbnail** | URL | Service thumbnail image URL |
| **SpecificDates** | Multi-select | For seasonal services, specific available dates |

## Environment Variable

Add to your `.env.local` or Vercel environment variables:

```env
NOTION_SERVICES_DATABASE_ID=your_database_id_here
```

## How to Get Database ID

1. Open your Notion database as a full page
2. Look at the URL: `https://notion.so/workspace/DATABASE_ID?v=...`
3. The `DATABASE_ID` is the 32-character string before the `?v=`

Example URL:
```
https://notion.so/myworkspace/abc123def456?v=xyz789
                              ^^^^^^^^^^^^ This is your database ID
```

## Creating Default Services

The system will return default services if the database is not configured, but to persist changes, you MUST:

1. Create the Notion database with the properties above
2. Add the database ID to your environment variables
3. Redeploy or restart your application

## Service Syncing

Once configured:
- ✅ Creating a service adds a page to Notion
- ✅ Updating a service updates the Notion page
- ✅ Deleting a service archives the Notion page
- ✅ Toggling enabled/disabled updates the checkbox
- ✅ Changes immediately reflect on the bookings page

## Why Notion Storage?

- **No filesystem access** on Vercel serverless
- **Centralized data** with your bookings database
- **Easy manual editing** directly in Notion if needed
- **Automatic backups** via Notion
- **Version history** for all changes
