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
    let calendarEvents;
    try {
      calendarEvents = await getCalendarEvents();
      console.log(`[Manual Sync] 📅 Found ${calendarEvents.length} calendar events`);
    } catch (calError) {
      console.error('[Manual Sync] Failed to fetch calendar events:', calError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch calendar events',
        details: calError instanceof Error ? calError.message : 'Unknown error'
      }, { status: 500 });
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
      const calendarEvent = calendarEvents.find(e => e.id === calendarEventId);
      
      if (!calendarEvent) {
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
      } else if (calendarEvent?.start?.dateTime) {
        // Event still exists - check if date/time changed
          const notionDate = props['Date']?.date?.start;
          const notionTime = props['Time']?.rich_text?.[0]?.text?.content;
          
          // Parse calendar event date/time
          let calendarDate: string;
          let calendarTime: string;
          
          try {
            const calendarDateTimeStr = calendarEvent.start.dateTime;
            
            // Google Calendar returns ISO 8601 with timezone offset (e.g., "2025-11-15T10:00:00+08:00")
            // Extract date and time from the ISO string
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
          } catch (parseError) {
            console.error('[Manual Sync] Error parsing calendar datetime:', parseError);
            continue; // Skip this booking
          }

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

    console.log(`[Manual Sync] ✅ Complete - Cancelled: ${deletedCount}, Updated: ${updatedCount}`);

    return NextResponse.json({
      success: true,
      message: 'Manual sync completed',
      timestamp: new Date().toISOString(),
      stats: {
        calendarEvents: calendarEvents.length,
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
