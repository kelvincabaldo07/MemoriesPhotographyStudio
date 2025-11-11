import { NextRequest, NextResponse } from 'next/server';

/**
 * Google Calendar Push Notifications Webhook
 * 
 * This endpoint receives notifications when events change in Google Calendar.
 * Setup required: Register a watch channel with Google Calendar API
 * 
 * Headers sent by Google:
 * - x-goog-resource-state: 'sync' | 'exists' | 'not_exists'
 * - x-goog-resource-id: Resource identifier
 * - x-goog-channel-id: Channel identifier
 * - x-goog-message-number: Message number
 */
export async function POST(request: NextRequest) {
  try {
    // Get headers from Google
    const resourceState = request.headers.get('x-goog-resource-state');
    const resourceId = request.headers.get('x-goog-resource-id');
    const channelId = request.headers.get('x-goog-channel-id');
    const messageNumber = request.headers.get('x-goog-message-number');
    
    console.log('[Google Calendar Webhook] ========================================');
    console.log('[Google Calendar Webhook] Received notification:', {
      resourceState,
      resourceId,
      channelId,
      messageNumber,
      timestamp: new Date().toISOString(),
    });

    // 'sync' state is just a verification ping when setting up the channel
    if (resourceState === 'sync') {
      console.log('[Google Calendar Webhook] Sync verification acknowledged');
      return NextResponse.json({ success: true, message: 'Sync acknowledged' });
    }

    // 'exists' means the calendar has changed
    if (resourceState === 'exists') {
      console.log('[Google Calendar Webhook] Calendar changed - triggering sync check');
      
      // TODO: Implement sync logic
      // 1. Fetch all calendar events
      // 2. Compare with Notion bookings
      // 3. Update Notion if events were deleted or modified
      
      console.log('[Google Calendar Webhook] ⚠️ Sync logic not yet implemented');
      console.log('[Google Calendar Webhook] To complete setup:');
      console.log('[Google Calendar Webhook] 1. Fetch calendar events using Google Calendar API');
      console.log('[Google Calendar Webhook] 2. Query Notion bookings database');
      console.log('[Google Calendar Webhook] 3. Find bookings with Calendar Event IDs that no longer exist');
      console.log('[Google Calendar Webhook] 4. Update those bookings to "Cancelled" status');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Calendar change detected - sync logic pending implementation' 
      });
    }

    // 'not_exists' means the resource was deleted
    if (resourceState === 'not_exists') {
      console.log('[Google Calendar Webhook] Resource deleted notification');
      return NextResponse.json({ success: true });
    }

    // Unknown state
    console.warn('[Google Calendar Webhook] Unknown resource state:', resourceState);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('[Google Calendar Webhook] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also handle GET for verification/testing
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Google Calendar webhook endpoint is ready',
    timestamp: new Date().toISOString(),
    note: 'This endpoint receives POST notifications from Google Calendar Push Notifications',
  });
}
