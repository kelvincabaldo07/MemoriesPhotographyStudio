# Adding Service Photos via Notion

## Overview
Your booking system is already set up to load service photos from Notion! You can now add theme photos without touching code or uploading files manually.

## Current Setup ✅
- ✅ Notion Services Database exists
- ✅ System reads from `NOTION_SERVICES_DATABASE_ID`
- ✅ **Thumbnail** field supported (just needs to be added!)

## Step-by-Step: Add Photos to Services

### 1. Add Thumbnail Property to Your Notion Database

1. Open your **Services** database in Notion
2. Click the `+` button to add a new property
3. Name it: **`Thumbnail`** (exact spelling, capital T)
4. Type: Select **"URL"**
5. Click outside to save

### 2. Upload Your Photos to Notion

You have two options:

#### Option A: Use External Image URL (Recommended ⭐)
**IMPORTANT:** Images embedded in Notion pages require authentication and won't work on your public booking site!

Upload photos to a public hosting service:
1. **Imgur** (Free & Easy):
   - Go to https://imgur.com
   - Upload image (no account needed)
   - Right-click image → "Copy Image Link"
   - Paste into **Thumbnail** field
   
2. **Google Drive** (Requires public link):
   - Upload to Google Drive
   - Right-click → Get Link → "Anyone with the link"
   - Change share URL format from:
     - `drive.google.com/file/d/FILE_ID/view`
     - To: `drive.google.com/uc?export=view&id=FILE_ID`
   - Paste into **Thumbnail** field

3. **Cloudinary** (Best for production):
   - Sign up at https://cloudinary.com (free tier)
   - Upload images
   - Copy the direct image URL
   - Paste into **Thumbnail** field

#### Option B: GitHub Repository (Also works)
Since your site is on GitHub:
1. Add images to `/booking/public/placeholders/services/`
2. Commit and push
3. Use path: `/placeholders/services/your-image.jpg`
4. This still requires code deployment though

### 3. Add the New Theme

Since "Pink Cloud Wonderland Theme" was just added:

1. Go to your Notion **Services** database
2. Click **"+ New"** to add a row
3. Fill in:
   - **Name**: `Pink Cloud Wonderland Theme`
   - **Type**: `With Photographer`
   - **Group**: `Kids Pre-birthday (Girls)`
   - **Description**: 
     ```
     Kids 0–7
     45 minutes session in our airconditioned studio
     WITH photographer
     FREE family portraits
     FREE use of all the backdrops and props
     ALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)
     ```
   - **BasePrice**: `1000`
   - **Duration**: `45`
   - **AvailableFrom**: `8`
   - **AvailableUntil**: `18`
   - **Enabled**: ✓ (checked)
   - **Thumbnail**: (paste your image URL here)

### 4. Verify It Works

1. Go to your booking page: `https://book.memories-studio.com`
2. Select **With Photographer**
3. Select **Kids Pre-birthday (Girls)**
4. You should see "Pink Cloud Wonderland Theme" with the photo!

## How It Works

### Priority System
The system uses this priority when showing photos:

1. **First**: Thumbnail from Notion (if URL exists)
2. **Fallback**: Local file in `/public/placeholders/services/` folder

### Example Flow
```
Service: "Pink Cloud Wonderland Theme"
↓
Check Notion database for Thumbnail URL
↓
If found → Use Notion image
If not found → Look for /placeholders/services/pink-cloud-wonderland-theme.jpg
```

## Managing All Service Photos

### Current Services That Need Photos

**Kids Pre-birthday (Girls):**
- [ ] Dreamy Rainbow Theme
- [ ] Bloom & Blush Theme
- [ ] Rainbow Boho Theme
- [ ] Pastel Daisies Theme
- [ ] Butterfly Theme
- [ ] Cuddly Bear Theme
- [ ] Mermaid Theme
- [ ] Hot Air Balloon Theme
- [ ] Pink Cloud Wonderland Theme ← NEW!

**Kids Pre-birthday (Boys):**
- [ ] Racing Theme
- [ ] Safari Theme
- [ ] Outer Space Theme
- [ ] Hot Air Balloon Theme
- [ ] Cuddly Bear Theme
- [ ] Under the Sea Theme
- [ ] Train Theme
- [ ] Navy Theme

## Benefits of Using Notion for Photos

✅ **No Redeployment** - Changes appear immediately
✅ **Easy Updates** - Just change the URL
✅ **Centralized** - All service data in one place
✅ **No Git** - No need to commit/push
✅ **Mobile Friendly** - Manage from your phone
✅ **Team Access** - Anyone with Notion access can update

## Best Practices

### Image Requirements
- **Format**: JPG or PNG
- **Size**: 800x600px or larger (landscape)
- **Aspect Ratio**: 4:3 or 16:9 recommended
- **File Size**: Under 2MB for fast loading

### Image Hosting Tips
- ✅ Use Notion's built-in image hosting (easiest)
- ✅ Use a CDN for better performance
- ❌ Avoid temporary image links
- ❌ Don't use links that require authentication

## Quick Add Template

When adding a new theme to Notion, copy this:

```
Name: [Theme Name Here]
Type: With Photographer
Group: Kids Pre-birthday (Girls) OR Kids Pre-birthday (Boys)
Description: Kids 0–7
45 minutes session in our airconditioned studio
WITH photographer
FREE family portraits
FREE use of all the backdrops and props
ALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)
BasePrice: 1000
Duration: 45
AvailableFrom: 8
AvailableUntil: 18
Enabled: ✓
Thumbnail: [Your image URL here]
```

## Troubleshooting

### Photo Not Showing
1. ✅ Check the **Thumbnail** field has a valid URL
2. ✅ Open the URL in a browser - does it load?
3. ✅ Check if **Enabled** checkbox is checked
4. ✅ Refresh the booking page (may need hard refresh: Ctrl+Shift+R)

### Photo Shows Broken Image
- The URL might be incorrect or expired
- Try uploading directly to Notion instead
- Make sure it's a public URL (not behind authentication)

### Changes Not Appearing
- The API has a short cache
- Wait 30 seconds and refresh
- Check that the database ID in `.env.local` is correct

## Next Steps

Want to add photos for all themes at once?

1. Create a folder in Google Drive
2. Upload all theme photos
3. Make folder publicly accessible
4. Copy each photo's share link
5. Paste into Notion's Thumbnail field for each service

---

**Need Help?** If you want to bulk-upload all theme photos to Notion, let me know and I can help automate it!
