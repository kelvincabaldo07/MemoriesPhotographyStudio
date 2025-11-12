# Services Management Guide

## Quick Add: New Theme Service

### Current Method (For Now)
When you want to add a new theme (like "Pink Cloud Wonderland Theme"), you need to update **2 places** in the code:

#### 1. Add to Services List
**File**: `booking/app/page.tsx`
**Line**: Around 155-165

Find the section:
```typescript
"Kids Pre-birthday (Girls)": [
  "Dreamy Rainbow Theme",
  "Bloom & Blush Theme",
  // ... other themes
],
```

Add your new theme to the array:
```typescript
"Pink Cloud Wonderland Theme",
```

#### 2. Add Service Details & Price
**File**: `booking/app/page.tsx`
**Line**: Around 250-255

Find where other themes are defined:
```typescript
"Mermaid Theme": { details: "Kids 0–7\n45 minutes...", price: 1000 },
```

Add your new theme:
```typescript
"Pink Cloud Wonderland Theme": { details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", price: 1000 },
```

#### 3. Add Photo
**File**: Upload to `booking/public/placeholders/services/`
**Filename**: Must match the theme name in lowercase with hyphens
- "Pink Cloud Wonderland Theme" → `pink-cloud-wonderland-theme.jpg`
- "Butterfly Theme" → `butterfly-theme.jpg`

---

## Future: Notion Integration (Recommended)

To manage services directly from Notion without touching code:

### Setup Overview
1. Create a **Services Database** in Notion
2. Connect it to the booking system via Notion API
3. Add/edit/disable services directly in Notion

### Services Database Structure

Create a new Notion database called **"Services"** with these properties:

| Property | Type | Example |
|----------|------|---------|
| **Name** | Title | "Pink Cloud Wonderland Theme" |
| **Type** | Select | "With Photographer", "Self-Shoot", "Seasonal" |
| **Group** | Select | "Kids Pre-birthday (Girls)", "Solo/Duo", etc. |
| **Description** | Text | "Kids 0–7\n45 minutes session..." |
| **Base Price** | Number | 1000 |
| **Duration** | Number | 45 |
| **Photo URL** | URL | Link to image in your cloud storage |
| **Enabled** | Checkbox | ✓ (checked = visible to customers) |
| **Available From** | Number | 8 (8 AM) |
| **Available Until** | Number | 18 (6 PM) |
| **Order** | Number | 1, 2, 3... (display order) |

### Benefits of Notion Integration
✅ Add new services without coding
✅ Update prices instantly
✅ Temporarily disable services (uncheck "Enabled")
✅ Change descriptions on the fly
✅ Reorder services easily
✅ Manage photos from one place

### Implementation Steps

#### 1. Create Notion Database
- Go to your Notion workspace
- Create new database: **"Services"**
- Add all properties listed above

#### 2. Add Your Current Services
Copy all existing themes from the code to Notion:
- Dreamy Rainbow Theme
- Bloom & Blush Theme
- Pink Cloud Wonderland Theme
- Racing Theme
- Safari Theme
- etc.

#### 3. Get Notion API Credentials
- Go to [notion.so/my-integrations](https://notion.so/my-integrations)
- Create new integration: "Memories Services Manager"
- Copy the API key
- Share your Services database with the integration

#### 4. Update Environment Variables
Add to `.env.local`:
```env
NOTION_SERVICES_DATABASE_ID=your_database_id_here
NOTION_API_KEY=secret_your_key_here
```

#### 5. Create API Route to Fetch Services
We would create: `booking/app/api/services/route.ts`

This would:
- Fetch all enabled services from Notion
- Cache them for performance
- Return them to the booking form

#### 6. Update Booking Form
Modify `page.tsx` to load services from the API instead of hardcoded data.

---

## Photo Management

### Current: Local Files
Photos stored in: `booking/public/placeholders/services/`

**Naming Convention:**
- Convert service name to lowercase
- Replace spaces with hyphens
- Keep special characters like `&`
- Add `.jpg` extension

Examples:
- "Pink Cloud Wonderland Theme" → `pink-cloud-wonderland-theme.jpg`
- "Bloom & Blush Theme" → `bloom-&-blush-theme.jpg`

### Future: Cloud Storage (Recommended)
Use Cloudinary, AWS S3, or Vercel Blob Storage:
- Easier to manage from anywhere
- Better performance
- Can update images without redeploying
- Store URL in Notion database

---

## Quick Reference

### Adding a New Theme (Current Method)

**Step 1:** Add to services array
```typescript
// Line ~155
"Kids Pre-birthday (Girls)": [
  // ... existing themes
  "Your New Theme Name",
],
```

**Step 2:** Add service info
```typescript
// Line ~250
"Your New Theme Name": { 
  details: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)", 
  price: 1000 
},
```

**Step 3:** Add photo
- Filename: `your-new-theme-name.jpg`
- Location: `booking/public/placeholders/services/`

**Step 4:** Commit & Push
```powershell
git add .
git commit -m "feat: add Your New Theme Name"
git push
```

---

## Contact for Help

If you want to set up the Notion integration so you can manage services without coding, let me know and I can implement it for you!
