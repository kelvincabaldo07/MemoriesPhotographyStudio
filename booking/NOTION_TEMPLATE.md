# Quick Notion Database Template

Copy this table structure into your Notion database:

## Database Properties Configuration

```
Property Name: Name
Type: Title
Description: Customer full name (First + Last)
---

Property Name: First Name
Type: Text
---

Property Name: Last Name
Type: Text
---

Property Name: Email  
Type: Email
---

Property Name: Phone
Type: Phone
---

Property Name: Address
Type: Text
---

Property Name: Service Type
Type: Select
Options:
  • Self-Shoot (Blue)
  • With Photographer (Purple)
  • Seasonal Sessions (Red)
---

Property Name: Service Category
Type: Select
Options:
  • Classic (Green) - includes printed photos +₱50
  • Digital (Teal) - digital only
---

Property Name: Service Group
Type: Text
Examples: "Solo/Duo", "Small Group", "Kids Pre-birthday (Girls)", "Christmas"
---

Property Name: Service
Type: Text
Examples: "Solo/Duo 30", "Dreamy Rainbow Theme", "2025 Christmas – White & Gold (Small Group)"
---

Property Name: Date
Type: Date
Format: MM/DD/YYYY
---

Property Name: Time
Type: Text
Example: "2:00 PM - 3:00 PM"
---

Property Name: Duration
Type: Number
Format: Number (no decimal)
Example: 15, 30, 45, 60 (in minutes)
---

Property Name: Backdrops
Type: Multi-select
Options:
  • Gray (#838383)
  • Mugwort (#99FFBB)
  • Beige (#F7D69D)
  • Ivory (#FFFFF0)
  • Light Blue (#ADD8E6)
  • Flame Red (#800000)
  • Carnation Pink (#FFA6C9)
Note: Only for Self-Shoot packages
---

Property Name: Backdrop Allocations
Type: Text
Description: JSON object showing minutes per backdrop
Example: {"Gray": 15, "Beige": 15}
---

Property Name: Backdrop Order
Type: Text
Description: Comma-separated order of backdrops
Example: "Gray, Beige"
---

Property Name: Add-ons
Type: Multi-select
Options:
  • Printed 1 4R photo (₱30)
  • Printed 2 photo strips (₱30)
  • Printed 4 wallet size photos (₱30)
  • Printed 1 4R photo (Canon Selphy CP1500) (₱50)
---

Property Name: Social Consent
Type: Select
Options:
  • yes (Green) - OK to post photos
  • no (Red) - Do NOT post
---

Property Name: Event Type
Type: Select
Options:
  • Birthday (Pink)
  • Graduation/Moving Up (Blue)
  • Prenup (Purple)
  • Wedding (Gold)
  • Monthsary (Rose)
  • Anniversary (Lavender)
  • Maternity (Mint)
  • Other (Gray)
---

Property Name: Celebrant Name
Type: Text
Description: Name of person being celebrated
---

Property Name: Birthday Age
Type: Text
Description: Age for birthday events (e.g., "1", "25", "7")
---

Property Name: Graduation Level
Type: Text
Description: Grade level (e.g., "Grade 6", "Preschool")
---

Property Name: Event Date
Type: Date
Description: Actual event date (if different from photoshoot date)
---

Property Name: Session Price
Type: Number
Format: Number (no decimal)
Currency: PHP ₱
Example: 400, 1000, 1550
---

Property Name: Add-ons Total
Type: Number
Format: Number (no decimal)
Currency: PHP ₱
Example: 0, 30, 60
---

Property Name: Grand Total
Type: Number
Format: Number (no decimal)
Currency: PHP ₱
Example: 400, 1030, 1610
---

Property Name: Status
Type: Select
Options:
  • Pending (Yellow)
  • Confirmed (Green)
  • Completed (Blue)
  • Cancelled (Red)
```

## Visual Example

Your database table should look like this (scroll horizontally to see all columns):

| Name | Service Type | Service Category | Service | Date | Time | Duration | Backdrops | Social Consent | Event Type | Status | Grand Total |
|------|-------------|------------------|---------|------|------|----------|-----------|---------------|------------|--------|-------------|
| John Doe | Self-Shoot | Digital | Solo/Duo 30 | Nov 15, 2025 | 2:00 PM - 2:30 PM | 30 | Gray, Beige | yes | Birthday | Confirmed | ₱400 |
| Maria Santos | With Photographer | Digital | Dreamy Rainbow Theme | Nov 20, 2025 | 10:00 AM - 10:45 AM | 45 | - | yes | Birthday | Pending | ₱1,030 |
| Pedro Cruz | Seasonal Sessions | Digital | 2025 Christmas – White & Gold (Small Group) | Dec 5, 2025 | 3:00 PM - 3:45 PM | 45 | - | no | - | Completed | ₱2,000 |
| Ana Reyes | Self-Shoot | Classic | Big Group 60 | Nov 18, 2025 | 4:00 PM - 5:00 PM | 60 | Mugwort, Ivory, Carnation Pink, Light Blue | yes | Graduation/Moving Up | Confirmed | ₱1,610 |

**Additional Fields (not shown in table above):**
- First Name, Last Name, Email, Phone, Address
- Service Group, Backdrop Allocations, Backdrop Order
- Add-ons, Session Price, Add-ons Total
- Celebrant Name, Birthday Age, Graduation Level, Event Date

## Quick Setup Checklist

- [ ] Create new database page in Notion
- [ ] Add all 27 properties with exact names (see list above)
- [ ] Set up Service Type select options (3 options)
- [ ] Set up Service Category select options (2 options)
- [ ] Set up Backdrops multi-select options (7 backdrop colors)
- [ ] Set up Add-ons multi-select options (4 add-on items)
- [ ] Set up Social Consent select options (2 options: yes/no)
- [ ] Set up Event Type select options (8 event types)
- [ ] Set up Status select options (4 status options)
- [ ] Create Notion integration at notion.so/my-integrations
- [ ] Copy integration token (NOTION_API_KEY)
- [ ] Connect integration to your database (••• menu > Add connections)
- [ ] Copy database ID from URL (NOTION_DATABASE_ID)
- [ ] Add both to .env.local file
- [ ] Add 4 sample bookings for testing (different service types)
- [ ] Restart dev server (npm run dev)
- [ ] Test in admin dashboard at /admin/bookings

**Total Properties: 27**
- Core Info: Name, First Name, Last Name, Email, Phone, Address (6)
- Service Details: Service Type, Service Category, Service Group, Service (4)
- Schedule: Date, Time, Duration (3)
- Backdrops: Backdrops, Backdrop Allocations, Backdrop Order (3)
- Add-ons: Add-ons (1)
- Event Info: Social Consent, Event Type, Celebrant Name, Birthday Age, Graduation Level, Event Date (6)
- Pricing: Session Price, Add-ons Total, Grand Total (3)
- Status: Status (1)

## Common Mistakes to Avoid

❌ **Wrong property names** - Must be exactly: "Name", "Email", "Phone", etc. (case-sensitive)
❌ **Wrong property types** - "Email" must be Email type, not Text
❌ **Forgot to connect integration** - Database won't be accessible without connection
❌ **Wrong database ID** - Should be 32 characters from the URL
❌ **Integration token wrong** - Should start with "secret_"

✅ **Correct setup** - Follow the guide step-by-step, test with sample data first!
