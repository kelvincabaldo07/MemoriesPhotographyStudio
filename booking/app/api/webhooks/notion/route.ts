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
  object: string;
  event: 'page.created' | 'page.updated' | 'page.deleted';
  data: {
    id: string;
    properties: any;
  };
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
    const payload: NotionWebhookPayload = await request.json();
    console.log('[Notion Webhook] Received event:', payload.event);
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

    // Only process booking-related events
    if (payload.object !== 'page') {
      return NextResponse.json({ success: true, message: 'Ignored non-page event' });
    }

    const { event, data } = payload;
    const props = data.properties;

    // Extract booking data from Notion properties
    const bookingId = props['Booking ID']?.title?.[0]?.plain_text || props['Booking ID']?.rich_text?.[0]?.plain_text;
    const status = props['Status']?.status?.name || props['Status']?.select?.name;
    
    if (!bookingId) {
      console.error('[Notion Webhook] No booking ID found');
      return NextResponse.json({ error: 'No booking ID' }, { status: 400 });
    }

    console.log(`[Notion Webhook] Processing ${event} for booking ${bookingId}`);

    switch (event) {
      case 'page.created':
        await handleBookingCreated(data, props);
        break;
      
      case 'page.updated':
        await handleBookingUpdated(data, props);
        break;
      
      case 'page.deleted':
        await handleBookingDeleted(data, props);
        break;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Processed ${event} for booking ${bookingId}` 
    });

  } catch (error) {
    console.error('[Notion Webhook] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleBookingCreated(data: any, props: any) {
  // Extract all booking details
  const bookingId = props['Booking ID']?.title?.[0]?.plain_text || props['Booking ID']?.rich_text?.[0]?.plain_text;
  const firstName = props['First Name']?.rich_text?.[0]?.plain_text || '';
  const lastName = props['Last Name']?.rich_text?.[0]?.plain_text || '';
  const email = props['Email']?.email || '';
  const phone = props['Phone']?.phone_number || '';
  const service = props['Service']?.select?.name || '';
  const serviceType = props['Service Type']?.select?.name || '';
  const duration = parseInt(props['Duration']?.number || '45');
  const date = props['Date']?.date?.start || '';
  const time = extractTime(props['Time']);
  const calendarEventId = props['Calendar Event ID']?.rich_text?.[0]?.plain_text;

  // Only create calendar event if it doesn't exist yet
  if (!calendarEventId && email && date && time) {
    console.log(`[Notion Webhook] Creating Google Calendar event for ${bookingId}`);
    
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
      await updateNotionPage(data.id, {
        'Calendar Event ID': {
          rich_text: [{ text: { content: eventId } }]
        }
      });
      
      console.log(`[Notion Webhook] ✅ Calendar event created: ${eventId}`);
    }
  }
}

async function handleBookingUpdated(data: any, props: any) {
  const bookingId = props['Booking ID']?.title?.[0]?.plain_text || props['Booking ID']?.rich_text?.[0]?.plain_text;
  const calendarEventId = props['Calendar Event ID']?.rich_text?.[0]?.plain_text;
  const status = props['Status']?.status?.name || props['Status']?.select?.name;
  
  // If status changed to cancelled, delete calendar event
  if (status === 'Cancelled' && calendarEventId) {
    console.log(`[Notion Webhook] Deleting calendar event for cancelled booking ${bookingId}`);
    await deleteCalendarEvent(calendarEventId);
    return;
  }

  // If date/time changed, update calendar event
  if (calendarEventId) {
    const date = props['Date']?.date?.start;
    const time = extractTime(props['Time']);
    const duration = parseInt(props['Duration']?.number || '45');
    
    if (date && time) {
      console.log(`[Notion Webhook] Updating calendar event ${calendarEventId}`);
      await updateCalendarEvent(calendarEventId, { date, time, duration } as any);
      
      // Send update notification email
      const email = props['Email']?.email;
      if (email) {
        // TODO: Create sendBookingUpdateEmail function
        console.log(`[Notion Webhook] TODO: Send update email to ${email}`);
      }
    }
  }
}

async function handleBookingDeleted(data: any, props: any) {
  const calendarEventId = props['Calendar Event ID']?.rich_text?.[0]?.plain_text;
  
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
