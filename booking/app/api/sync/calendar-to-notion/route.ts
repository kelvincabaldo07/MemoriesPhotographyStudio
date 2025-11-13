import { NextRequest, NextResponse } from 'next/server';
import { getCalendarEvents } from '@/lib/google-calendar';

/**
 * Manual Google Calendar to Notion Sync Endpoint
 * Use this to manually trigger sync when Google push notifications aren't working
 * 
 * Usage: GET https://book.memories-studio.com/api/sync/calendar-to-notion
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Manual Sync] ========================================');
    console.log('[Manual Sync] Starting manual Calendar → Notion sync');
    console.log('[Manual Sync] Timestamp:', new Date().toISOString());
    
    const notionApiKey = process.env.NOTION_API_KEY;
    const notionDatabaseId = process.env.NOTION_DATABASE_ID;

    if (!notionApiKey || !notionDatabaseId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing Notion credentials' 
      }, { status: 500 });
    }

    // Fetch all calendar events from the past 30 days to 90 days in the future
    const calendarEvents = await getCalendarEvents();
    
    // Create a map of calendar event IDs for quick lookup
    const calendarEventMap = new Map(
      calendarEvents
        .filter(event => event.id)
        .map(event => [event.id, event])
    );

    console.log(`[Manual Sync] 📅 Found ${calendarEventMap.size} calendar events`);

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

    console.log(`[Manual Sync] 📋 Found ${notionBookings.length} Notion bookings with calendar events`);

    // Check each Notion booking
    let deletedCount = 0;
    let updatedCount = 0;
    const updates: any[] = [];

    for (const booking of notionBookings) {
      const props = booking.properties;
      const calendarEventId = props['Calendar Event ID']?.rich_text?.[0]?.text?.content;
      const bookingId = props['Booking ID']?.title?.[0]?.text?.content || booking.id.slice(0, 8);
      
      if (!calendarEventId) continue;

      // Check if the calendar event still exists
      if (!calendarEventMap.has(calendarEventId)) {
        // Event was deleted from calendar - update Notion to Cancelled
        console.log(`[Manual Sync] ❌ Event ${calendarEventId} deleted - cancelling booking ${bookingId}`);

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
        updates.push({
          bookingId,
          eventId: calendarEventId,
          action: 'cancelled',
          reason: 'Event deleted from calendar'
        });
      } else {
        // Event still exists - check if date/time changed
        const calendarEvent = calendarEventMap.get(calendarEventId);
        
        if (calendarEvent?.start?.dateTime) {
          const notionDate = props['Date']?.date?.start;
          const notionTime = props['Time']?.rich_text?.[0]?.text?.content;
          
          // Parse calendar event date/time in Manila timezone (UTC+8)
          const calendarDateTime = new Date(calendarEvent.start.dateTime);
          
          // Convert to Manila time (Asia/Manila is UTC+8)
          const manilaTime = new Date(calendarDateTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
          
          // Extract date and time in Manila timezone
          const calendarDate = manilaTime.toISOString().split('T')[0];
          const hours = manilaTime.getHours().toString().padStart(2, '0');
          const minutes = manilaTime.getMinutes().toString().padStart(2, '0');
          const calendarTime = `${hours}:${minutes}`;

          // Check if date or time changed
          if (notionDate !== calendarDate || notionTime !== calendarTime) {
            console.log(`[Manual Sync] 🔄 Event ${calendarEventId} changed - updating booking ${bookingId}`);
            console.log(`[Manual Sync]    Notion: ${notionDate} ${notionTime}`);
            console.log(`[Manual Sync]    Calendar: ${calendarDate} ${calendarTime}`);

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
            updates.push({
              bookingId,
              eventId: calendarEventId,
              action: 'updated',
              oldDateTime: `${notionDate} ${notionTime}`,
              newDateTime: `${calendarDate} ${calendarTime}`
            });
          }
        }
      }
    }

    console.log(`[Manual Sync] ✅ Complete - Cancelled: ${deletedCount}, Updated: ${updatedCount}`);

    return NextResponse.json({
      success: true,
      message: 'Manual sync completed',
      timestamp: new Date().toISOString(),
      stats: {
        calendarEvents: calendarEventMap.size,
        notionBookings: notionBookings.length,
        cancelled: deletedCount,
        updated: updatedCount,
      },
      updates: updates.length > 0 ? updates : undefined,
    });

  } catch (error) {
    console.error('[Manual Sync] ❌ Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Manual sync failed',
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
