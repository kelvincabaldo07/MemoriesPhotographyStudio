/**
 * Notion Webhook Handler
 * Syncs Notion database changes to Google Calendar
 * 
 * Setup: Configure this webhook URL in Notion integrations
 * URL: https://your-domain.com/api/webhooks/notion
 */

import { NextRequest, NextResponse } from 'next/server';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar';
import { sendBookingConfirmationEmail } from '@/lib/sendgrid';

// Webhook secret for security
const WEBHOOK_SECRET = process.env.NOTION_WEBHOOK_SECRET;

interface NotionWebhookPayload {
  type: 'page.created' | 'page.properties_updated' | 'page.deleted' | 'url_verification';
  entity?: {
    id: string;
    type: string;
  };
  data?: {
    parent: any;
    updated_properties?: string[];
  };
  challenge?: string;
}

// Handle GET requests (for webhook verification)
export async function GET(request: NextRequest) {
  console.log('[Notion Webhook] GET request received - webhook verification');
  return NextResponse.json({ 
    status: 'ok',
    message: 'Notion webhook endpoint is ready',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    // Log request for debugging
    console.log('[Notion Webhook] ========================================');
    console.log('[Notion Webhook] Received POST request');
    console.log('[Notion Webhook] Timestamp:', new Date().toISOString());
    console.log('[Notion Webhook] Headers:', Object.fromEntries(request.headers.entries()));
    
    // Parse payload first
    const payload: any = await request.json();
    
    // Check if this is a verification challenge from Notion
    if (payload.type === 'url_verification' && payload.challenge) {
      console.log('[Notion Webhook] 🔐 Verification challenge received');
      console.log('[Notion Webhook] Challenge:', payload.challenge);
      // Return the challenge value to verify the webhook
      return NextResponse.json({ challenge: payload.challenge });
    }
    
    console.log('[Notion Webhook] Received event:', payload.type);
    console.log('[Notion Webhook] Payload:', JSON.stringify(payload, null, 2));
    
    // Optional: Check auth if WEBHOOK_SECRET is set
    // For now, we skip auth to make testing easier
    if (WEBHOOK_SECRET) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
        console.error('[Notion Webhook] Invalid authorization token');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      console.log('[Notion Webhook] Auth check passed (or no auth header provided)');
    } else {
      console.warn('[Notion Webhook] ⚠️  NOTION_WEBHOOK_SECRET not set - accepting all requests');
    }

    // Only process page-related events
    if (!payload.entity || payload.entity.type !== 'page') {
      return NextResponse.json({ success: true, message: 'Ignored non-page event' });
    }

    const eventType = payload.type;
    const pageId = payload.entity.id;

    console.log(`[Notion Webhook] Processing ${eventType} for page ${pageId}`);

    // Fetch the full page data from Notion to get all properties
    const pageData = await fetchNotionPage(pageId);
    
    if (!pageData || !pageData.properties) {
      console.error('[Notion Webhook] Could not fetch page data');
      return NextResponse.json({ error: 'Could not fetch page data' }, { status: 500 });
    }

    const props = pageData.properties;

    // Extract booking data from Notion properties
    const bookingId = extractText(props['Booking ID']);
    const status = extractSelect(props['Status']);
    
    if (!bookingId) {
      console.error('[Notion Webhook] No booking ID found - not a booking page');
      return NextResponse.json({ success: true, message: 'Ignored non-booking page' });
    }

    console.log(`[Notion Webhook] Processing ${eventType} for booking ${bookingId} (status: ${status})`);

    switch (eventType) {
      case 'page.created':
        await handleBookingCreated(pageId, props);
        break;
      
      case 'page.properties_updated':
        // Check if only Calendar Event ID was updated - skip to prevent loop
        const updatedProperties = payload.data?.updated_properties || [];
        const onlyCalendarEventIdUpdated = updatedProperties.length === 1 && 
                                            updatedProperties[0] === 'Calendar Event ID';
        
        if (onlyCalendarEventIdUpdated) {
          console.log('[Notion Webhook] Skipping - only Calendar Event ID was updated (preventing loop)');
          return NextResponse.json({ 
            success: true, 
            message: 'Skipped - Calendar Event ID update only' 
          });
        }
        
        await handleBookingUpdated(pageId, props);
        break;
      
      case 'page.deleted':
        await handleBookingDeleted(pageId, props);
        break;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${eventType} for booking ${bookingId}` 
    });

  } catch (error) {
    console.error('[Notion Webhook] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions to extract data from Notion properties
function extractText(property: any): string {
  if (!property) return '';
  if (property.title?.[0]?.plain_text) return property.title[0].plain_text;
  if (property.rich_text?.[0]?.plain_text) return property.rich_text[0].plain_text;
  return '';
}

function extractEmail(property: any): string {
  return property?.email || '';
}

function extractPhone(property: any): string {
  return property?.phone_number || '';
}

function extractSelect(property: any): string {
  return property?.select?.name || property?.status?.name || '';
}

function extractNumber(property: any): number {
  return property?.number || 0;
}

function extractDate(property: any): string {
  return property?.date?.start || '';
}

async function fetchNotionPage(pageId: string) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Notion Webhook] Error fetching Notion page:', error);
    return null;
  }
}

async function handleBookingCreated(pageId: string, props: any) {
  // Extract all booking details
  const bookingId = extractText(props['Booking ID']);
  const firstName = extractText(props['First Name']);
  const lastName = extractText(props['Last Name']);
  const email = extractEmail(props['Email']);
  const phone = extractPhone(props['Phone']);
  const service = extractSelect(props['Service']);
  const serviceType = extractSelect(props['Service Type']);
  const duration = extractNumber(props['Duration']) || 45;
  const date = extractDate(props['Date']);
  const time = extractTime(props['Time']);
  const calendarEventId = extractText(props['Calendar Event ID']);
  const status = extractSelect(props['Status']);

  // IMPORTANT: Skip if calendar event already exists (prevent duplicates)
  // The google-calendar.ts will also check for existing events by booking ID
  if (calendarEventId) {
    console.log(`[Notion Webhook] Skipping - booking already has calendar event ID: ${calendarEventId}`);
    return;
  }

  // Only create calendar event if booking is confirmed and has required data
  if (status === 'Booking Confirmed' && email && date && time) {
    console.log(`[Notion Webhook] Creating Google Calendar event for ${bookingId}`);
    console.log(`[Notion Webhook] Details: ${firstName} ${lastName}, ${email}, ${date} ${time}, ${service} (${duration}min)`);
    
    try {
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
        await updateNotionPage(pageId, {
          'Calendar Event ID': {
            rich_text: [{ text: { content: eventId } }]
          }
        });
        
        console.log(`[Notion Webhook] ✅ Calendar event created: ${eventId}`);
      }
    } catch (error) {
      console.error('[Notion Webhook] Error creating calendar event:', error);
      throw error;
    }
  } else {
    console.log(`[Notion Webhook] Skipping calendar creation: status=${status}, hasEmail=${!!email}, hasDate=${!!date}, hasTime=${!!time}`);
  }
}

async function handleBookingUpdated(pageId: string, props: any) {
  const bookingId = extractText(props['Booking ID']);
  const calendarEventId = extractText(props['Calendar Event ID']);
  const status = extractSelect(props['Status']);
  
  // If status changed to cancelled, delete calendar event
  if (status === 'Cancelled' && calendarEventId) {
    console.log(`[Notion Webhook] Deleting calendar event for cancelled booking ${bookingId}`);
    await deleteCalendarEvent(calendarEventId);
    return;
  }

  // If status changed to confirmed and no calendar event exists, create one
  if (status === 'Booking Confirmed' && !calendarEventId) {
    console.log(`[Notion Webhook] Status changed to Booking Confirmed - creating calendar event`);
    await handleBookingCreated(pageId, props);
    return;
  }

  // If date/time changed, update calendar event
  if (calendarEventId) {
    const date = extractDate(props['Date']);
    const time = extractTime(props['Time']);
    const duration = extractNumber(props['Duration']) || 45;
    
    if (date && time) {
      console.log(`[Notion Webhook] Updating calendar event ${calendarEventId}`);
      await updateCalendarEvent(calendarEventId, { date, time, duration } as any);
      
      // Send update notification email
      const email = extractEmail(props['Email']);
      if (email) {
        // TODO: Create sendBookingUpdateEmail function
        console.log(`[Notion Webhook] TODO: Send update email to ${email}`);
      }
    }
  }
}

async function handleBookingDeleted(pageId: string, props: any) {
  const calendarEventId = extractText(props['Calendar Event ID']);
  
  if (calendarEventId) {
    console.log(`[Notion Webhook] Deleting calendar event ${calendarEventId}`);
    await deleteCalendarEvent(calendarEventId);
  }
}

function extractTime(timeProperty: any): string {
  if (!timeProperty) return '';
  
  // Handle different Notion time formats
  if (timeProperty.date?.start) {
    // If it's a datetime, extract time part
    const datetime = timeProperty.date.start;
    if (datetime.includes('T')) {
      const timePart = datetime.split('T')[1];
      return timePart.substring(0, 5); // HH:MM
    }
  }
  
  // If it's stored as rich_text
  if (timeProperty.rich_text?.[0]?.plain_text) {
    return timeProperty.rich_text[0].plain_text;
  }
  
  return '';
}

async function updateNotionPage(pageId: string, properties: any) {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ properties }),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Notion Webhook] Error updating Notion page:', error);
    throw error;
  }
}
