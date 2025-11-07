# Notion Database Setup Guide for Memories Photography Studio

## Step 1: Create a New Notion Database

1. Go to [Notion](https://www.notion.so)
2. Create a new page in your workspace
3. Type `/database` and select **"Table - Inline"**
4. Name it **"Photography Bookings"**

## Step 2: Configure Database Properties

You need to create these exact properties (property names must match exactly):

### Required Properties:

| Property Name | Property Type | Options/Format |
|--------------|---------------|----------------|
| **Name** | Title | Customer full name (default title field) |
| **Email** | Email | Customer email address |
| **Phone** | Phone | Customer phone number |
| **Service Type** | Select | Self-Shoot, With Photographer, Seasonal Sessions |
| **Service Category** | Select | Classic, Digital |
| **Service Group** | Text | Solo/Duo, Small Group, Big Group, etc. |
| **Service** | Text | Full service name (e.g., "Solo/Duo 15", "Racing Theme") |
| **Date** | Date | Booking date |
| **Time** | Text | Time slot (e.g., "2:00 PM - 3:00 PM") |
| **Duration** | Number | Session duration in minutes |
| **Backdrops** | Multi-select | Selected backdrop colors |
| **Backdrop Allocations** | Text | Time per backdrop in JSON format |
| **Backdrop Order** | Text | Order of backdrops |
| **Add-ons** | Multi-select | Additional items purchased |
| **Social Consent** | Select | yes, no |
| **Event Type** | Select | Birthday, Graduation/Moving Up, Prenup, Wedding, etc. |
| **Celebrant Name** | Text | Name of person being celebrated |
| **Birthday Age** | Text | Age for birthday events |
| **Graduation Level** | Text | Grade level for graduations |
| **Event Date** | Date | Actual event date (if different from shoot) |
| **Session Price** | Number | Base session price |
| **Add-ons Total** | Number | Total add-ons cost |
| **Grand Total** | Number | Final total price |
| **Status** | Select | Pending, Confirmed, Completed, Cancelled |
| **Address** | Text | Customer address |
| **First Name** | Text | Customer first name |
| **Last Name** | Text | Customer last name |

### Property Details:

#### **Service Type** (Select) - Add these 3 options:
- Self-Shoot
- With Photographer
- Seasonal Sessions

#### **Service Category** (Select) - Add these 2 options:
- Classic (with prints)
- Digital (digital only)

#### **Backdrops** (Multi-select) - Add these 7 backdrop colors:
- Gray
- Mugwort
- Beige
- Ivory
- Light Blue
- Flame Red
- Carnation Pink

#### **Add-ons** (Multi-select) - Add these options:
- Printed 1 4R photo
- Printed 2 photo strips
- Printed 4 wallet size photos
- Printed 1 4R photo (Canon Selphy CP1500)

#### **Social Consent** (Select) - Add these 2 options:
- yes
- no

#### **Event Type** (Select) - Add these options:
- Birthday
- Graduation/Moving Up
- Prenup
- Wedding
- Monthsary
- Anniversary
- Maternity
- Other

#### **Status** (Select) - Add these 4 options:
- Pending (Yellow)
- Confirmed (Green)
- Completed (Blue)
- Cancelled (Red)

*Colors are recommended for easier status tracking*

## Step 3: Get Your Notion API Key

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name it: **"Memories Photography Booking System"**
4. Select your workspace
5. Click **"Submit"**
6. Copy the **"Internal Integration Token"** (starts with `secret_`)
7. Save this as `NOTION_API_KEY` in your `.env.local` file

## Step 4: Connect Integration to Your Database

1. Open your **"Photography Bookings"** database in Notion
2. Click the **"•••"** menu (top right)
3. Scroll down and click **"+ Add connections"**
4. Select **"Memories Photography Booking System"** integration
5. Click **"Confirm"**

## Step 5: Get Your Database ID

The Database ID is in the URL of your database page:

```
https://www.notion.so/[workspace]/[DATABASE_ID]?v=[view_id]
                                 ^^^^^^^^^^^^^^^^
                                 This is your Database ID
```

Example:
- URL: `https://www.notion.so/myworkspace/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6?v=...`
- Database ID: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

Copy this and save as `NOTION_DATABASE_ID` in your `.env.local` file

## Step 6: Update Your .env.local File

Add these lines to your `.env.local` file (or create it if it doesn't exist):

```env
# Notion API Configuration
NOTION_API_KEY=secret_your_notion_integration_token_here
NOTION_DATABASE_ID=your_database_id_here
```

## Step 7: Test with Sample Data

Add a few sample bookings to your Notion database to test:

### Sample Booking 1 - Self-Shoot Digital:
- **Name**: John Doe
- **Email**: john@example.com
- **Phone**: +63 912 345 6789
- **Service Type**: Self-Shoot
- **Service Category**: Digital
- **Service Group**: Solo/Duo
- **Service**: Solo/Duo 30
- **Date**: 2025-11-15
- **Time**: 2:00 PM - 2:30 PM
- **Duration**: 30
- **Backdrops**: Gray, Beige
- **Backdrop Allocations**: {"Gray": 15, "Beige": 15}
- **Backdrop Order**: Gray, Beige
- **Add-ons**: (leave empty or select one)
- **Social Consent**: yes
- **Event Type**: Birthday
- **Celebrant Name**: John Doe
- **Birthday Age**: 25
- **Event Date**: 2025-11-20
- **Session Price**: 400
- **Add-ons Total**: 0
- **Grand Total**: 400
- **Status**: Confirmed
- **Address**: 123 Sample St, Manila
- **First Name**: John
- **Last Name**: Doe

### Sample Booking 2 - With Photographer (Kids):
- **Name**: Maria Santos
- **Email**: maria@example.com
- **Phone**: +63 917 234 5678
- **Service Type**: With Photographer
- **Service Category**: Digital
- **Service Group**: Kids Pre-birthday (Girls)
- **Service**: Dreamy Rainbow Theme
- **Date**: 2025-11-20
- **Time**: 10:00 AM - 10:45 AM
- **Duration**: 45
- **Backdrops**: (leave empty - photographer provides set)
- **Backdrop Allocations**: (leave empty)
- **Backdrop Order**: (leave empty)
- **Add-ons**: Printed 1 4R photo
- **Social Consent**: yes
- **Event Type**: Birthday
- **Celebrant Name**: Sofia Santos
- **Birthday Age**: 1
- **Event Date**: 2025-11-25
- **Session Price**: 1000
- **Add-ons Total**: 30
- **Grand Total**: 1030
- **Status**: Pending
- **Address**: 456 Example Ave, Quezon City
- **First Name**: Maria
- **Last Name**: Santos

### Sample Booking 3 - Seasonal Christmas:
- **Name**: Pedro Cruz
- **Email**: pedro@example.com
- **Phone**: +63 923 456 7890
- **Service Type**: Seasonal Sessions
- **Service Category**: Digital
- **Service Group**: Christmas
- **Service**: 2025 Christmas – White & Gold (Small Group)
- **Date**: 2025-12-05
- **Time**: 3:00 PM - 3:45 PM
- **Duration**: 45
- **Backdrops**: (leave empty - seasonal set provided)
- **Backdrop Allocations**: (leave empty)
- **Backdrop Order**: (leave empty)
- **Add-ons**: (leave empty)
- **Social Consent**: no
- **Event Type**: (leave empty when consent is no for seasonal)
- **Celebrant Name**: (leave empty)
- **Birthday Age**: (leave empty)
- **Event Date**: (leave empty)
- **Session Price**: 2000
- **Add-ons Total**: 0
- **Grand Total**: 2000
- **Status**: Completed
- **Address**: 789 Test Road, Pasig
- **First Name**: Pedro
- **Last Name**: Cruz

### Sample Booking 4 - Self-Shoot Classic (with prints):
- **Name**: Ana Reyes
- **Email**: ana@example.com
- **Phone**: +63 928 765 4321
- **Service Type**: Self-Shoot
- **Service Category**: Classic
- **Service Group**: Big Group
- **Service**: Big Group 60
- **Date**: 2025-11-18
- **Time**: 4:00 PM - 5:00 PM
- **Duration**: 60
- **Backdrops**: Mugwort, Ivory, Carnation Pink, Light Blue
- **Backdrop Allocations**: {"Mugwort": 15, "Ivory": 15, "Carnation Pink": 15, "Light Blue": 15}
- **Backdrop Order**: Mugwort, Ivory, Carnation Pink, Light Blue
- **Add-ons**: Printed 2 photo strips, Printed 4 wallet size photos
- **Social Consent**: yes
- **Event Type**: Graduation/Moving Up
- **Celebrant Name**: Ana Reyes Jr.
- **Graduation Level**: Grade 6
- **Event Date**: 2025-11-22
- **Session Price**: 1550 (1500 base + 50 for Classic)
- **Add-ons Total**: 60
- **Grand Total**: 1610
- **Status**: Confirmed
- **Address**: 321 Test Lane, Makati
- **First Name**: Ana
- **Last Name**: Reyes

## Step 8: Verify Connection

1. Make sure your `.env.local` file has both `NOTION_API_KEY` and `NOTION_DATABASE_ID`
2. Restart your Next.js dev server:
   ```powershell
   npm run dev
   ```
3. Sign in to the admin dashboard at `http://localhost:3000/admin/login`
4. Navigate to the **Bookings** page
5. You should see your sample bookings loaded from Notion!

## Troubleshooting

### "Failed to fetch bookings" error:
- ✅ Check that the integration is connected to your database (Step 4)
- ✅ Verify your `NOTION_API_KEY` is correct (starts with `secret_`)
- ✅ Verify your `NOTION_DATABASE_ID` is correct (32 characters, no dashes)
- ✅ Make sure all required properties exist with exact names

### Empty bookings list:
- ✅ Check that you have at least one entry in your Notion database
- ✅ Verify the property names match exactly (case-sensitive)
- ✅ Check browser console for error messages

### Property not found errors:
- ✅ Ensure property names are spelled exactly as shown above
- ✅ Property names are case-sensitive: "Name" not "name"

## Optional: Create Views in Notion

You can create helpful views in your database:

1. **By Status**: Group by Status field
2. **By Date**: Sort by Date (descending)
3. **By Service**: Group by Service field
4. **Revenue Report**: Filter by Status = Confirmed or Completed

## Next Steps

Once your Notion database is set up and connected:

1. ✅ Test creating bookings through your customer booking form
2. ✅ Verify they appear in Notion
3. ✅ Check that they show up in the admin dashboard
4. ✅ Test the customer and analytics pages
5. ✅ Configure email notifications (N8N webhook)

---

**Need help?** Check the [Notion API Documentation](https://developers.notion.com/) for more details.
