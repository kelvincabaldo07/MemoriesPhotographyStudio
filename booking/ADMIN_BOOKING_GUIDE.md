# Admin Booking Feature

## Overview

The admin panel now includes the ability to book appointments on behalf of customers. This feature bypasses email verification and allows booking during off-hours.

## Features

### 1. **No Email Verification Required**
- Admin bookings skip OTP verification
- Booking is confirmed immediately

### 2. **Off-Hours Booking Override**
- By default, respects studio operating hours:
  - Monday-Friday: 10 AM - 4 PM
  - Saturday: 10 AM - 6 PM
  - Sunday: 1 PM - 6 PM
- Enable "Allow booking during off-hours" to book any time (00:00 - 23:45)

### 3. **Double-Booking Prevention**
- System checks for time conflicts automatically
- Cannot double-book the same time slot
- Off-hours override allows force booking if needed

### 4. **Same Features as Customer Booking**
- Full service selection
- Date and time picker
- Customer information form
- Booking confirmation email sent to customer
- Google Calendar event created
- Notion database updated
- Audit log maintained

## How to Use

### Access the Feature

1. Log in to the admin panel
2. Click **"Book Customer"** in the navigation menu

### Booking Process

#### Step 1: Select Service
1. Choose **Service Type** (Self-Shoot, With Photographer, Seasonal Sessions)
2. Select **Category** (Digital or Classic)
3. Pick a **Group** (e.g., Solo/Duo, Small Group)
4. Choose the specific **Service**
5. Review service details and pricing
6. Click **"Next: Schedule"**

#### Step 2: Select Date & Time
1. **Optional**: Enable "Allow booking during off-hours" for flexible scheduling
   - ⚠️ Only use this when necessary (e.g., special arrangements)
2. Navigate the calendar to select a date
3. Choose an available time slot
   - Green = Available
   - Gray = Already booked
4. Click **"Next: Customer Info"**

#### Step 3: Enter Customer Information
1. Fill in customer details:
   - First Name
   - Last Name
   - Email
   - Phone Number
2. Review the booking summary
3. Click **"Create Booking"**

#### Step 4: Confirmation
- Booking is created immediately
- Customer receives confirmation email
- Google Calendar invitation sent
- Page redirects to bookings list

## Technical Details

### API Endpoint
- **POST** `/api/admin/bookings`
- Requires admin authentication
- Accepts same booking data as customer booking endpoint

### Security
- ✅ Admin authentication required
- ✅ Audit logging for all admin bookings
- ✅ Double-booking prevention
- ✅ Records admin user who created the booking

### Database Fields
- All standard booking fields
- Additional field: **"Booked By"** = `Admin: {email}`

### Notifications
- ✅ Email confirmation sent to customer
- ✅ Google Calendar invitation sent
- ✅ Notion database updated
- ❌ No OTP verification

## Use Cases

### When to Use Admin Booking

1. **Phone Bookings**
   - Customer calls to book
   - Admin creates booking on their behalf

2. **Walk-in Customers**
   - Customer visits studio in person
   - Quick booking without customer needing to use website

3. **Special Arrangements**
   - VIP customers
   - Off-hours bookings
   - Emergency bookings

4. **Technical Issues**
   - Customer having trouble with website
   - Email verification not working

5. **Group Bookings**
   - Corporate events
   - Wedding parties
   - Multiple bookings for one client

### When NOT to Use

- Regular online bookings (let customers book themselves)
- Testing (use test accounts or staging environment)

## Off-Hours Override

### What It Does
- Allows booking outside normal operating hours
- Bypasses time slot availability restrictions
- Still prevents double-booking (checks actual bookings)

### When to Enable
- ✅ Special arrangements with customer
- ✅ Extended hours for events
- ✅ VIP/priority customers
- ✅ Emergency bookings

### When NOT to Enable
- ❌ Regular bookings during business hours
- ❌ Unless customer specifically requested off-hours

## Troubleshooting

### "Time slot is already booked"
- Another booking exists at that time
- Enable off-hours override if you need to force the booking
- Or choose a different time slot

### "Unauthorized"
- You're not logged in as admin
- Session may have expired
- Log in again to the admin panel

### Email not sent
- Check Resend API key configuration
- Booking still succeeds (email is non-critical)
- Customer won't receive confirmation email

### Calendar event not created
- Check Google Calendar API configuration
- Booking still succeeds (calendar is non-critical)
- Event won't appear in Google Calendar

## Best Practices

1. **Verify Customer Information**
   - Double-check email and phone number
   - Use proper capitalization for names

2. **Confirm Time with Customer**
   - Verbally confirm date and time
   - Especially for off-hours bookings

3. **Document Special Arrangements**
   - Note any special requests
   - Keep record of why off-hours was used

4. **Follow Up**
   - Confirm customer received email
   - Send manual confirmation if needed

5. **Audit Trail**
   - All admin bookings are logged
   - Your admin email is recorded
   - Check audit logs regularly

## Navigation

- Admin Dashboard: `/admin/dashboard`
- All Bookings: `/admin/bookings`
- **Book Customer: `/admin/book-customer`**
- Customer List: `/admin/customers`
- Services: `/admin/services`
- Availability: `/admin/availability`
- Settings: `/admin/settings`

## Files Modified

- ✅ Page: `/app/admin/(protected)/book-customer/page.tsx`
- ✅ API: `/app/api/admin/bookings/route.ts` (added POST method)
- ✅ Navigation: `/components/admin/AdminNav.tsx`

---

**Last Updated:** January 11, 2026
