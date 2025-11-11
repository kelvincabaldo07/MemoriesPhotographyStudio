import { NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * Cron Job: Renew Google Calendar Watch Channel
 * 
 * Google Calendar push notifications expire after ~7 days.
 * This endpoint renews the watch channel to keep receiving notifications.
 * 
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/renew-calendar-watch",
 *     "schedule": "0 0 * * 0"
 *   }]
 * }
 * 
 * The schedule above runs every Sunday at midnight UTC.
 */
export async function GET() {
  try {
    console.log('[Cron] ========================================');
    console.log('[Cron] Renewing Google Calendar watch channel...');
    console.log('[Cron] Timestamp:', new Date().toISOString());

    // Setup OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/callback`
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Set expiration to 7 days from now (Google's max is ~7 days)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    const expiration = expirationDate.getTime();

    // Create unique channel ID
    const channelId = `memories-booking-sync-${Date.now()}`;

    console.log('[Cron] Registering watch channel:', {
      channelId,
      expiration: expirationDate.toISOString(),
      webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/google-calendar`,
    });

    // Register the watch channel
    const response = await calendar.events.watch({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/google-calendar`,
        expiration: expiration.toString(),
      },
    });

    console.log('[Cron] ✅ Calendar watch channel renewed successfully!');
    console.log('[Cron] Resource ID:', response.data.resourceId);
    console.log('[Cron] Expiration:', new Date(parseInt(response.data.expiration || '0')).toISOString());
    
    return NextResponse.json({ 
      success: true,
      message: 'Calendar watch channel renewed',
      channelId: response.data.id,
      resourceId: response.data.resourceId,
      expiration: new Date(parseInt(response.data.expiration || '0')).toISOString(),
      nextRenewal: new Date(expirationDate.getTime() - (24 * 60 * 60 * 1000)).toISOString(), // 1 day before expiration
    });

  } catch (error) {
    console.error('[Cron] ❌ Failed to renew calendar watch channel:', error);
    
    // Return error details for debugging
    if (error && typeof error === 'object' && 'response' in error) {
      const googleError = error as any;
      console.error('[Cron] Google API Error:', {
        status: googleError.response?.status,
        statusText: googleError.response?.statusText,
        data: googleError.response?.data,
      });
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to renew calendar watch',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also allow POST for manual triggering
export async function POST() {
  return GET();
}
