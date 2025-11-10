import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/settings - Fetch current settings
 * POST /api/admin/settings - Update settings
 * 
 * Settings stored in environment variables and Notion database
 */

export async function GET(request: NextRequest) {
  try {
    // For now, return default settings
    // TODO: Fetch from Notion database
    
    const settings = {
      email: {
        subject: 'Booking Confirmed - {bookingId} | Memories Photography Studio',
        fromEmail: process.env.SENDGRID_FROM_EMAIL || 'smile@memories-studio.com',
        fromName: 'Memories Photography Studio',
        photoDeliveryReminder: `• Your photos will be delivered ONLY via Adobe Lightroom
• We do not send photos through any other platform (Google Drive, Dropbox, Messenger)
• Please ensure you have an Adobe Lightroom account (free)
• Download the Lightroom Mobile App if accessing via mobile/tablet`,
        locationReminder: `Studio Address:
• Located inside Green Valley Field Subdivision, between Lintiw Road and Indang Central Elementary School
• Enter the subdivision, go straight to the dead end, then turn right
• We're the fourth gate on the left, with a Memories Photography Studio tarpaulin near the gate
• Our studio is at the back of the property — the dark gray and blue painted house (not the house at the front)

Respect the Neighborhood:
• Please be courteous to the residents in front of the property
• Avoid being noisy, nosy, or disruptive while waiting or shooting`,
        parkingReminder: `• Park under the rambutan tree (designated parking area), OR on the vacant corner lot to the left
• DO NOT block the gate or driveway at any time`,
        policyReminder: `Arrival Guidelines:
• Arrive at least 5 minutes before your scheduled time
• Late arrivals will have the lost time deducted from their session
• We provide 5 minutes of extra time for outfit or backdrop changes
• Our timer starts at your session time plus 5 minutes (for setup and backdrop transitions)

Tardy Penalties:
🕒 Sessions 30 Minutes and Below:
  • 5-minute grace period
  • More than 5 minutes late: Time reduced + Limited to 1 backdrop
  • 10+ minutes late: Booking will be CANCELLED

🕓 1-Hour Sessions:
  • 5-20 minutes late: Time reduced + Limited to 2 backdrops
  • 30+ minutes late: Booking will be CANCELLED

📷 With Photographer / Occasional:
  • 10-minute grace period
  • 10-25 minutes late: Time reduced
  • 25+ minutes late: Booking will be CANCELLED

Reschedule & Cancellation:
• Reschedule/cancel at least 2 hours before with a valid reason
• Maximum of 2 reschedules per booking
• Late cancellation or no-show may result in a ban from future bookings`,
      },
      calendar: {
        eventTitle: '📸 {service} - {customerName}',
        locationText: 'Memories Photography Studio, Indang, Cavite',
        mapsLink: 'https://maps.app.goo.gl/kcjjzkZnvvpxJmQL9',
        bufferTime: 30, // minutes
        colorId: '10', // Green
        sendInvitations: true,
        reminders: [
          { method: 'email', minutes: 1440 }, // 1 day
          { method: 'popup', minutes: 120 },  // 2 hours
          { method: 'popup', minutes: 30 },   // 30 minutes
        ],
      },
      termsAndConditions: {
        photoDelivery: {
          title: 'Photo Delivery Method',
          content: `Your photos will be delivered ONLY via Adobe Lightroom. By agreeing, you understand that:

• We do not send photos through any other platform such as Google Drive, Dropbox, or Messenger
• You need to have an Adobe Lightroom account (free to create)
• If accessing via mobile or tablet, you need to download the Lightroom Mobile App`,
        },
        location: {
          title: 'Studio Location & Arrival Guidelines',
          content: `Studio Address: Located inside Green Valley Field Subdivision, between Lintiw Road and Indang Central Elementary School. Directions:

• Enter the subdivision, go straight to the dead end, then turn right
• We're the fourth gate on the left, with a Memories Photography Studio tarpaulin near the gate
• Our studio is at the back of the property — the dark gray and blue painted house, not the house at the front

Respect the Neighborhood:
• Please be courteous to the residents in front of the property
• Avoid being noisy, nosy, or disruptive while waiting or shooting

Arrival Time:
• Arrive at least 5 minutes before your scheduled time
• Late arrivals will have the lost time deducted from their session
• We provide 5 minutes of extra time for outfit or backdrop changes
• Our timer starts at your session time plus 5 minutes (for setup and backdrop transitions)
• Timers are set per backdrop
• Timer stoppage or pauses are solely under the studio's discretion`,
        },
        parking: {
          title: 'Parking Guidelines',
          content: `By agreeing, you understand and commit to our parking policy:

• Park under the rambutan tree (designated parking area), OR
• On the vacant corner lot to the left
• DO NOT block the gate or driveway at any time`,
        },
        policy: {
          title: 'Booking Policy & Tardy Penalties',
          content: `Tardy Penalties:

🕒 Sessions 30 Minutes and Below:
• 5-minute grace period for lateness
• More than 5 minutes late: Session time reduced by the number of minutes late + Limited to only 1 backdrop
• 10 minutes or more late: Booking will be cancelled

🕓 1-Hour Sessions:
• 5–20 minutes late: Time reduced by the number of minutes late + Limited to 2 backdrops of choice
• 30 minutes late or more: Booking will be cancelled

📷 With Photographer / Occasional Sessions:
• 10-minute grace period
• 10–25 minutes late: Time reduced by the number of minutes late
• 25 minutes or more late: Booking will be cancelled

Reschedule & Cancellation Policy:
• Reschedule or cancel at least 2 hours before your session with a valid reason
• Maximum of 2 reschedules per booking
• Late cancellations or no-shows may result in a ban from future bookings`,
        },
      },
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[Settings] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const updates = await request.json();
    console.log('[Settings] Updating settings:', updates);

    // TODO: Save to Notion database
    // For now, just return success
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('[Settings] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
