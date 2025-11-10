/**
 * Admin Sync Endpoint
 * Manually sync all bookings between Notion and Google Calendar
 * 
 * This ensures all systems are in sync:
 * - Notion bookings → Google Calendar events
 * - Google Calendar events → Availability on booking page
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent, updateCalendarEvent } from '@/lib/google-calendar';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const BOOKINGS_DB_ID = process.env.NOTION_BOOKINGS_DATABASE_ID!;

export async function POST(request: NextRequest) {
  try {
    console.log('[Sync] Starting sync process...');
    
    // Fetch all confirmed bookings from Notion
    const response = await notion.databases.query({
      database_id: BOOKINGS_DB_ID,
      filter: {
        or: [
          {
            property: 'Status',
            status: { equals: 'Confirmed' }
          },
          {
            property: 'Status',
            select: { equals: 'Confirmed' }
          }
        ]
      }
    });

    const results: any[] = [];
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const page of response.results) {
      try {
        const props = (page as any).properties;
        
        // Extract booking data
        const bookingId = extractText(props['Booking ID']);
        const calendarEventId = extractText(props['Calendar Event ID']);
        const firstName = extractText(props['First Name']);
        const lastName = extractText(props['Last Name']);
        const email = extractEmail(props['Email']);
        const phone = extractPhone(props['Phone']);
        const service = extractSelect(props['Service']);
        const serviceType = extractSelect(props['Service Type']);
        const duration = extractNumber(props['Duration']) || 45;
        const date = extractDate(props['Date']);
        const time = extractTime(props['Time']);

        if (!bookingId || !email || !date || !time) {
          console.log(`[Sync] Skipping ${bookingId || 'unknown'} - missing required fields`);
          skipped++;
          results.push({ bookingId, status: 'skipped', reason: 'Missing required fields' });
          continue;
        }

        // If no calendar event ID, create one
        if (!calendarEventId) {
          console.log(`[Sync] Creating calendar event for ${bookingId}`);
          
          const eventId = await createCalendarEvent({
            bookingId,
            customer: { firstName, lastName, email, phone },
            service,
            serviceType,
            duration,
            date,
            time,
          });

          if (eventId) {
            // Update Notion with calendar event ID
            await notion.pages.update({
              page_id: page.id,
              properties: {
                'Calendar Event ID': {
                  rich_text: [{ text: { content: eventId } }]
                }
              }
            });
            
            created++;
            results.push({ bookingId, status: 'created', eventId });
            console.log(`[Sync] ✅ Created event ${eventId} for ${bookingId}`);
          } else {
            errors++;
            results.push({ bookingId, status: 'error', reason: 'Failed to create calendar event' });
          }
        } else {
          // Calendar event exists - could update it here if needed
          skipped++;
          results.push({ bookingId, status: 'skipped', reason: 'Calendar event already exists', eventId: calendarEventId });
        }
      } catch (error) {
        errors++;
        console.error('[Sync] Error processing booking:', error);
        results.push({ 
          bookingId: 'unknown', 
          status: 'error', 
          reason: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    console.log(`[Sync] Complete: ${created} created, ${updated} updated, ${skipped} skipped, ${errors} errors`);

    return NextResponse.json({
      success: true,
      summary: {
        total: response.results.length,
        created,
        updated,
        skipped,
        errors
      },
      results
    });

  } catch (error) {
    console.error('[Sync] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Helper functions to extract data from Notion properties
function extractText(prop: any): string {
  if (!prop) return '';
  if (prop.title && prop.title[0]) return prop.title[0].plain_text || '';
  if (prop.rich_text && prop.rich_text[0]) return prop.rich_text[0].plain_text || '';
  return '';
}

function extractEmail(prop: any): string {
  return prop?.email || '';
}

function extractPhone(prop: any): string {
  return prop?.phone_number || '';
}

function extractSelect(prop: any): string {
  return prop?.select?.name || prop?.status?.name || '';
}

function extractNumber(prop: any): number | null {
  return prop?.number || null;
}

function extractDate(prop: any): string {
  return prop?.date?.start || '';
}

function extractTime(prop: any): string {
  if (!prop) return '';
  
  // If it's a datetime property
  if (prop.date?.start) {
    const datetime = prop.date.start;
    if (datetime.includes('T')) {
      const timePart = datetime.split('T')[1];
      return timePart.substring(0, 5); // HH:MM
    }
  }
  
  // If it's stored as rich_text
  if (prop.rich_text?.[0]?.plain_text) {
    return prop.rich_text[0].plain_text;
  }
  
  return '';
}
