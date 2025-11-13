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
      if (process.env.NODE_ENV === 'development') {
        console.log('[Google Calendar Webhook] Calendar changed - triggering sync');
      }
      
      // Sync Google Calendar changes to Notion
      await syncCalendarToNotion();
      
      return NextResponse.json({ 
        success: true, 
        message: 'Calendar sync triggered' 
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

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Calendar Sync] Found ${calendarEventIds.size} calendar events`);
    }

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

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Calendar Sync] Found ${notionBookings.length} Notion bookings with calendar events`);
    }

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
          const calendarDateTime = new Date(calendarEvent.start.dateTime);
          const calendarDate = calendarDateTime.toISOString().split('T')[0];
          const calendarTime = calendarDateTime.toTimeString().slice(0, 5); // HH:MM format

          // Check if date or time changed
          if (notionDate !== calendarDate || notionTime !== calendarTime) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[Calendar Sync] Event ${calendarEventId} time changed - updating Notion booking`);
              console.log(`[Calendar Sync] Old: ${notionDate} ${notionTime} -> New: ${calendarDate} ${calendarTime}`);
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

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Calendar Sync] Complete - Cancelled: ${deletedCount}, Updated: ${updatedCount}`);
    }

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
