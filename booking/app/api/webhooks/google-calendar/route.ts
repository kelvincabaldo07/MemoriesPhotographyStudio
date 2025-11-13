import { NextRequest, NextResponse } from 'next/server';
import { getCalendarEvent, getCalendarEvents } from '@/lib/google-calendar';

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
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Google Calendar Webhook] ========================================');
      console.log('[Google Calendar Webhook] Received notification:', {
        resourceState,
        resourceId,
        channelId,
        messageNumber,
        timestamp: new Date().toISOString(),
      });
    }

    // 'sync' state is just a verification ping when setting up the channel
    if (resourceState === 'sync') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Google Calendar Webhook] Sync verification acknowledged');
      }
      return NextResponse.json({ success: true, message: 'Sync acknowledged' });
    }

    // 'exists' means the calendar has changed
    if (resourceState === 'exists') {
      // Always log calendar change notifications (even in production) for debugging
      console.log('[Google Calendar Webhook] 📅 Calendar changed - triggering sync at', new Date().toISOString());
      
      // Sync Google Calendar changes to Notion
      await syncCalendarToNotion();
      
      console.log('[Google Calendar Webhook] ✅ Sync completed');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Calendar sync triggered',
        timestamp: new Date().toISOString()
      });
    }

    // 'not_exists' means the resource was deleted
    if (resourceState === 'not_exists') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Google Calendar Webhook] Resource deleted notification');
      }
      return NextResponse.json({ success: true });
    }

    // Unknown state
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Google Calendar Webhook] Unknown resource state:', resourceState);
    }
    return NextResponse.json({ success: true });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Google Calendar Webhook] Error:', error);
    }
    return NextResponse.json(
      { error: 'Internal error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Sync Google Calendar events back to Notion
 * Detects deleted or modified events and updates Notion accordingly
 */
async function syncCalendarToNotion() {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const notionDatabaseId = process.env.NOTION_DATABASE_ID;

    if (!notionApiKey || !notionDatabaseId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Calendar Sync] Missing Notion credentials');
      }
      return;
    }

    // Fetch all calendar events from the past 30 days to 90 days in the future
    const calendarEvents = await getCalendarEvents();
    
    // Create a map of calendar event IDs for quick lookup
    const calendarEventIds = new Set(
      calendarEvents
        .filter(event => event.id)
        .map(event => event.id)
    );

    // Always log sync attempts for debugging
    console.log(`[Calendar Sync] 🔍 Starting sync - Found ${calendarEventIds.size} calendar events`);

    // Query Notion for all bookings with Calendar Event IDs
    const notionResponse = await fetch('https://api.notion.com/v1/databases/' + notionDatabaseId + '/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: 'Calendar Event ID',
              rich_text: {
                is_not_empty: true,
              },
            },
            {
              property: 'Status',
              select: {
                does_not_equal: 'Cancelled',
              },
            },
          ],
        },
      }),
    });

    if (!notionResponse.ok) {
      throw new Error(`Notion API error: ${notionResponse.statusText}`);
    }

    const notionData = await notionResponse.json();
    const notionBookings = notionData.results || [];

    console.log(`[Calendar Sync] 📋 Found ${notionBookings.length} Notion bookings with calendar events`);

    // Check each Notion booking to see if its calendar event still exists
    let deletedCount = 0;
    let updatedCount = 0;

    for (const booking of notionBookings) {
      const props = booking.properties;
      const calendarEventId = props['Calendar Event ID']?.rich_text?.[0]?.text?.content;
      
      if (!calendarEventId) continue;

      // Check if the calendar event still exists
      if (!calendarEventIds.has(calendarEventId)) {
        // Event was deleted from calendar - update Notion to Cancelled
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Calendar Sync] Calendar event ${calendarEventId} deleted - cancelling Notion booking ${booking.id}`);
        }

        await fetch(`https://api.notion.com/v1/pages/${booking.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${notionApiKey}`,
            'Content-Type': 'application/json',
            'Notion-Version': '2022-06-28',
          },
          body: JSON.stringify({
            properties: {
              'Status': {
                select: {
                  name: 'Cancelled',
                },
              },
            },
          }),
        });

        deletedCount++;
      } else {
        // Event still exists - check if date/time changed
        const calendarEvent = calendarEvents.find(e => e.id === calendarEventId);
        
        if (calendarEvent?.start?.dateTime) {
          const notionDate = props['Date']?.date?.start;
          const notionTime = props['Time']?.rich_text?.[0]?.text?.content;
          
          // Parse calendar event date/time
          const calendarDateTimeStr = calendarEvent.start.dateTime;
          
          // Google Calendar returns ISO 8601 with timezone offset (e.g., "2025-11-15T10:00:00+08:00")
          // Extract date and time from the ISO string
          let calendarDate: string;
          let calendarTime: string;
          
          if (calendarDateTimeStr.includes('+08:00') || calendarDateTimeStr.includes('+08')) {
            // Already in Manila timezone (+08:00)
            const [datePart, timePart] = calendarDateTimeStr.split('T');
            calendarDate = datePart;
            calendarTime = timePart.substring(0, 5); // HH:MM
          } else {
            // Convert from other timezone to Manila
            const dt = new Date(calendarDateTimeStr);
            const manilaStr = dt.toLocaleString('en-US', { timeZone: 'Asia/Manila', hour12: false });
            // Parse "MM/DD/YYYY, HH:MM:SS" format
            const [dateStr, timeStr] = manilaStr.split(', ');
            const [month, day, year] = dateStr.split('/');
            calendarDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            calendarTime = timeStr.substring(0, 5);
          }

          // Debug logging
          console.log(`[Calendar Sync] � Checking event ${calendarEventId.substring(0, 8)}...`);
          console.log(`[Calendar Sync]    Notion: ${notionDate} ${notionTime}`);
          console.log(`[Calendar Sync]    Calendar: ${calendarDate} ${calendarTime}`);
          console.log(`[Calendar Sync]    Raw calendar time: ${calendarDateTimeStr}`);

          // Check if date or time changed
          if (notionDate !== calendarDate || notionTime !== calendarTime) {
            console.log(`[Calendar Sync] 🔄 MISMATCH DETECTED - updating Notion booking ${booking.id.substring(0, 8)}`);

            await fetch(`https://api.notion.com/v1/pages/${booking.id}`, {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${notionApiKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28',
              },
              body: JSON.stringify({
                properties: {
                  'Date': {
                    date: {
                      start: calendarDate,
                    },
                  },
                  'Time': {
                    rich_text: [
                      {
                        text: {
                          content: calendarTime,
                        },
                      },
                    ],
                  },
                },
              }),
            });

            updatedCount++;
          }
        }
      }
    }

    console.log(`[Calendar Sync] ✅ Complete - Cancelled: ${deletedCount}, Updated: ${updatedCount}`);

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Calendar Sync] Error:', error);
    }
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
