/**
 * Notion Webhook Handler
 * Syncs Notion database changes to Google Calendar
 * 
 * Setup: Configure this webhook URL in Notion integrations
 * URL: https://your-domain.com/api/webhooks/notion
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createCalendarEvent, createBlockedCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/google-calendar';
import { sendBookingConfirmationEmail, sendBookingUpdateEmail, sendBookingResendConfirmationEmail, sendBookingReminderEmail } from '@/lib/email';
import { calculateEndTime } from '@/lib/time-utils';

// Webhook secret for security
const WEBHOOK_SECRET = process.env.NOTION_WEBHOOK_SECRET;
const BUFFER_MINUTES = 30;

/** Fields written back by the webhook itself — skip re-processing when only these changed */
const WEBHOOK_WRITTEN_FIELDS = new Set([
  'Calendar Event ID', 'Booking ID', 'Time',
  // Email trigger reset + counters (we write these back after handling)
  'Resend Confirmation', 'Send Reminder',
  'Confirmation Sent Count', 'Reminder Sent Count',
]);

/** Notion property names that act as one-shot email trigger buttons */
const EMAIL_TRIGGER_FIELDS = ['Resend Confirmation', 'Send Reminder'] as const;

/** Generate a Booking ID in the same format as the app: MMRS-YYYYMMDDHH-XXXXXXXX */
function generateBookingId(date: string, time: string): string {
  const [year, month, day] = date.split('-');
  const hour = time.split(':')[0];
  const dateTimePart = `${year}${month}${day}${hour}`;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const buf = randomBytes(6);
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[buf[i % 6] % chars.length];
  return `MMRS-${dateTimePart}-${code}`;
}

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

    // ── Blocked time handling ─────────────────────────────────────────────
    // If Status is "Blocked" treat this page as a studio block, not a booking
    if (status === 'Blocked' || status === 'Studio Block' || status === 'Blocked Time') {
      console.log(`[Notion Webhook] Detected blocked-time page (status: ${status})`);
      const existingEventId = extractText(props['Calendar Event ID']);
      if (!existingEventId) {
        await handleBlockedTime(pageId, props, eventType);
      } else if (eventType === 'page.deleted') {
        await deleteCalendarEvent(existingEventId);
      }
      return NextResponse.json({ success: true, message: `Processed block: ${status}` });
    }
    // ─────────────────────────────────────────────────────────────────────

    // ── Email trigger check (runs BEFORE bookingId guard so it always works) ─
    if (eventType === 'page.properties_updated') {
      const updatedProperties: string[] = payload.data?.updated_properties || [];

      // Diagnostic: log exactly what Notion sent so we can verify property names
      console.log('[Notion Webhook] updated_properties:', JSON.stringify(updatedProperties));
      console.log('[Notion Webhook] Resend Confirmation prop:', JSON.stringify(props['Resend Confirmation']));
      console.log('[Notion Webhook] Send Reminder prop:', JSON.stringify(props['Send Reminder']));

      const resendConfirmationTriggered =
        updatedProperties.includes('Resend Confirmation') &&
        props['Resend Confirmation']?.checkbox === true;
      const sendReminderTriggered =
        updatedProperties.includes('Send Reminder') &&
        props['Send Reminder']?.checkbox === true;

      console.log('[Notion Webhook] resendConfirmationTriggered:', resendConfirmationTriggered, '| sendReminderTriggered:', sendReminderTriggered);

      if (resendConfirmationTriggered || sendReminderTriggered) {
        await handleEmailTriggers(pageId, props, resendConfirmationTriggered, sendReminderTriggered);
        // If the only changes were the trigger checkboxes, stop here
        const onlyTriggers = updatedProperties.every(p => EMAIL_TRIGGER_FIELDS.includes(p as any));
        if (onlyTriggers) {
          return NextResponse.json({ success: true, message: 'Email trigger handled' });
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    if (!bookingId) {
      console.error('[Notion Webhook] No booking ID found - not a booking page');
      return NextResponse.json({ success: true, message: 'Ignored non-booking page' });
    }

    console.log(`[Notion Webhook] Processing ${eventType} for booking ${bookingId} (status: ${status})`);

    switch (eventType) {
      case 'page.created':
        await handleBookingCreated(pageId, props);
        break;
      
      case 'page.properties_updated': {
        const updatedProperties: string[] = payload.data?.updated_properties || [];

        // ── Loop-prevention ───────────────────────────────────────────────────
        // Skip if:
        //   a) Notion gave us an empty list (we wrote back and it didn't include field names)
        //   b) Every changed field is one we wrote ourselves
        const nothingChanged = updatedProperties.length === 0;
        const allWrittenByUs = updatedProperties.length > 0 &&
          updatedProperties.every((p: string) => WEBHOOK_WRITTEN_FIELDS.has(p));

        if (nothingChanged || allWrittenByUs) {
          console.log('[Notion Webhook] Skipping - no user-driven changes detected. updatedProperties:', updatedProperties);
          return NextResponse.json({ success: true, message: 'Skipped - no user-driven changes' });
        }

        await handleBookingUpdated(pageId, props, updatedProperties);
        break;
      }
      
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
  let bookingId = extractText(props['Booking ID']);
  const firstName = extractText(props['First Name']);
  const lastName = extractText(props['Last Name']);
  const email = extractEmail(props['Email']);
  const phone = extractPhone(props['Phone']);
  const service = extractText(props['Service']) || extractSelect(props['Service']);
  const serviceType = extractSelect(props['Service Type']);
  const serviceCategory = extractSelect(props['Service Category']);
  const serviceGroup = extractText(props['Service Group']);
  const duration = extractNumber(props['Duration']) || 45;
  const date = extractDate(props['Date']);
  const time = extractTime(props['Time']);
  const calendarEventId = extractText(props['Calendar Event ID']);
  const status = extractSelect(props['Status']);

  // Must have at least date + start time
  if (!date || !time) {
    console.log(`[Notion Webhook] Skipping page ${pageId} — no date/time`);
    return;
  }

  // Skip non-booking statuses
  const skipStatuses = ['', 'Blocked', 'Studio Block', 'Blocked Time', 'Cancelled', 'No Show'];
  if (skipStatuses.includes(status)) {
    console.log(`[Notion Webhook] Skipping status: ${status}`);
    return;
  }

  // Fields to write back in one Notion PATCH
  const notionUpdates: Record<string, any> = {};

  // 1️⃣ Generate Booking ID if missing
  if (!bookingId) {
    bookingId = generateBookingId(date, time);
    notionUpdates['Booking ID'] = { rich_text: [{ text: { content: bookingId } }] };
    console.log(`[Notion Webhook] Generated Booking ID: ${bookingId}`);
  }

  // 2️⃣ Stamp end time on the Time property if it only has a start
  const hasEndTime = !!props['Time']?.date?.end;
  if (!hasEndTime) {
    const endTime = calculateEndTime(time, duration + BUFFER_MINUTES);
    const startDateTime = `${date}T${time}:00.000+08:00`;
    const endDateTime   = `${date}T${endTime}:00.000+08:00`;
    notionUpdates['Time'] = { date: { start: startDateTime, end: endDateTime } };
    console.log(`[Notion Webhook] Stamped end time: ${time} → ${endTime} (${duration}min + ${BUFFER_MINUTES}min buffer)`);
  }

  // Write Booking ID + Time back to Notion first
  if (Object.keys(notionUpdates).length > 0) {
    await updateNotionPage(pageId, notionUpdates);
  }

  // 3️⃣ Create Google Calendar event (skip if already exists)
  if (calendarEventId) {
    console.log(`[Notion Webhook] Calendar event already exists: ${calendarEventId}`);
    return;
  }

  try {
    // Derive a display name even if First/Last Name fields are empty
    const fullName = `${firstName} ${lastName}`.trim()
      || extractText(props['Client Name'])
      || 'Customer';
    const [fn, ...rest] = fullName.split(' ');

    const eventId = await createCalendarEvent({
      bookingId,
      customer: {
        firstName: firstName || fn || fullName,
        lastName:  lastName  || rest.join(' ') || '',
        email:     email  || '',
        phone:     phone  || '',
      },
      service:         service || 'Studio Session',
      serviceType:     serviceType || '',
      serviceCategory: serviceCategory || '',
      serviceGroup:    serviceGroup || '',
      duration,
      date,
      time,
    });

    if (eventId) {
      await updateNotionPage(pageId, {
        'Calendar Event ID': { rich_text: [{ text: { content: eventId } }] },
      });
      console.log(`[Notion Webhook] ✅ Calendar event created: ${eventId}`);
    }
  } catch (error) {
    console.error('[Notion Webhook] Error creating calendar event:', error);
    throw error;
  }
}

/** Fields whose change is meaningful enough to notify the customer */
const CUSTOMER_VISIBLE_FIELDS = new Set(['Date', 'Time', 'Service', 'Service Type', 'Duration', 'First Name', 'Last Name', 'Client Name']);

async function handleBookingUpdated(pageId: string, props: any, updatedProperties: string[] = []) {
  const bookingId      = extractText(props['Booking ID']);
  const calendarEventId = extractText(props['Calendar Event ID']);
  const status         = extractSelect(props['Status']);
  const firstName      = extractText(props['First Name']);
  const lastName       = extractText(props['Last Name']);
  const email          = extractEmail(props['Email']);
  const phone          = extractPhone(props['Phone']);
  const service        = extractText(props['Service']) || extractSelect(props['Service']);
  const serviceType    = extractSelect(props['Service Type']);
  const serviceCategory = extractSelect(props['Service Category']);
  const serviceGroup   = extractText(props['Service Group']);
  const duration       = extractNumber(props['Duration']) || 45;
  const date           = extractDate(props['Date']);
  const time           = extractTime(props['Time']);

  // Derive a display name even if First/Last are empty
  const fullName = `${firstName} ${lastName}`.trim()
    || extractText(props['Client Name'])
    || 'Customer';
  const [fn, ...rest] = fullName.split(' ');
  const resolvedFirst = firstName || fn || fullName;
  const resolvedLast  = lastName  || rest.join(' ') || '';

  // Cancelled or No Show → remove calendar event
  if ((status === 'Cancelled' || status === 'No Show') && calendarEventId) {
    console.log(`[Notion Webhook] Deleting calendar event for ${status} booking ${bookingId}`);
    await deleteCalendarEvent(calendarEventId);
    return;
  }

  // No calendar event yet on a confirmed booking → delegate to create handler
  if (!calendarEventId) {
    if (status === 'Booking Confirmed' && date && time) {
      console.log(`[Notion Webhook] No calendar event — creating one for ${bookingId}`);
      await handleBookingCreated(pageId, props);
    }
    return;
  }

  if (!date || !time) {
    console.log(`[Notion Webhook] Skipping update — no date/time for ${bookingId}`);
    return;
  }

  // ── Past booking guard ─────────────────────────────────────────────────
  // Compare booking date to today in Manila time (Asia/Manila = UTC+8)
  const todayManila = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
  );
  todayManila.setHours(0, 0, 0, 0);
  const bookingDate = new Date(`${date}T00:00:00+08:00`);
  if (bookingDate < todayManila) {
    console.log(`[Notion Webhook] Skipping auto-update for past booking ${bookingId} (${date})`);
    return;
  }
  // ──────────────────────────────────────────────────────────────────────
  const endTime       = calculateEndTime(time, duration + BUFFER_MINUTES);
  const startDateTime = `${date}T${time}:00.000+08:00`;
  const endDateTime   = `${date}T${endTime}:00.000+08:00`;
  await updateNotionPage(pageId, {
    'Time': { date: { start: startDateTime, end: endDateTime } },
  });

  // ── 2. Update Google Calendar event (rebuilds description + invite) ─────
  console.log(`[Notion Webhook] Updating calendar event ${calendarEventId} for ${bookingId}`);
  await updateCalendarEvent(calendarEventId, {
    bookingId,
    customer: { firstName: resolvedFirst, lastName: resolvedLast, email: email || '', phone: phone || '' },
    service:         service || 'Studio Session',
    serviceType:     serviceType || '',
    serviceCategory: serviceCategory || '',
    serviceGroup:    serviceGroup || '',
    duration,
    date,
    time,
  });

  // ── 3. Send update email — only when customer-visible fields changed ────
  const hasCustomerVisibleChange = updatedProperties.length > 0 &&
    updatedProperties.some(p => CUSTOMER_VISIBLE_FIELDS.has(p));

  if (hasCustomerVisibleChange && email) {
    await sendBookingUpdateEmail({
      bookingId,
      customer: { firstName: resolvedFirst, lastName: resolvedLast, email, phone: phone || '' },
      service:     service || undefined,
      serviceType: serviceType || undefined,
      duration,
      date,
      time,
    });
    console.log(`[Notion Webhook] ✅ Update email sent for ${bookingId} (changed: ${updatedProperties.join(', ')})`);
  } else if (!hasCustomerVisibleChange) {
    console.log(`[Notion Webhook] ℹ️  Skipping update email — no customer-visible fields changed (changed: ${updatedProperties.join(', ')})`);
  } else {
    console.log(`[Notion Webhook] ℹ️  No email on record — skipping update notification for ${bookingId}`);
  }
}

/**
 * Handle one-shot email trigger checkboxes set via Notion buttons.
 * IMPORTANT: Checkboxes are reset to false FIRST (separate PATCH) before any
 * email is sent, so if the email or count update fails the loop cannot continue.
 */
async function handleEmailTriggers(
  pageId: string,
  props: any,
  resendConfirmation: boolean,
  sendReminder: boolean,
) {
  const bookingId   = extractText(props['Booking ID']);
  const firstName   = extractText(props['First Name']);
  const lastName    = extractText(props['Last Name']);
  const email       = extractEmail(props['Email']);
  const phone       = extractPhone(props['Phone']);
  const service     = extractText(props['Service']) || extractSelect(props['Service']);
  const serviceType = extractSelect(props['Service Type']);
  const duration    = extractNumber(props['Duration']) || 45;
  const date        = extractDate(props['Date']);
  const time        = extractTime(props['Time']);

  const fullName = `${firstName} ${lastName}`.trim()
    || extractText(props['Client Name'])
    || 'Customer';
  const [fn, ...rest] = fullName.split(' ');
  const resolvedFirst = firstName || fn || fullName;
  const resolvedLast  = lastName  || rest.join(' ') || '';

  // ── STEP 1: Reset checkboxes immediately (MUST happen before anything else) ─
  // This breaks any potential loop even if subsequent steps fail.
  const checkboxReset: Record<string, any> = {};
  if (resendConfirmation) checkboxReset['Resend Confirmation'] = { checkbox: false };
  if (sendReminder)       checkboxReset['Send Reminder']       = { checkbox: false };

  try {
    await updateNotionPage(pageId, checkboxReset);
    console.log('[Notion Webhook] ✅ Checkboxes reset:', Object.keys(checkboxReset).join(', '));
  } catch (err) {
    // Log but continue — email should still send; we'll try the reset again below
    console.error('[Notion Webhook] ❌ Checkbox reset PATCH failed:', err);
  }

  // ── STEP 2: Guard — need email + date + time to send ──────────────────────
  if (!email) {
    console.warn(`[Notion Webhook] ⚠️  Email trigger: no email on record for ${bookingId} — stopped after reset`);
    return;
  }
  if (!date || !time) {
    console.warn(`[Notion Webhook] ⚠️  Email trigger: no date/time for ${bookingId} — stopped after reset`);
    return;
  }

  const emailData = {
    bookingId,
    customer: { firstName: resolvedFirst, lastName: resolvedLast, email, phone: phone || '' },
    service:     service     || undefined,
    serviceType: serviceType || undefined,
    duration,
    date,
    time,
  };

  // ── STEP 3: Send emails ────────────────────────────────────────────────────
  const countUpdates: Record<string, any> = {};

  if (resendConfirmation) {
    const prevCount = extractNumber(props['Confirmation Sent Count']) || 0;
    const sent = await sendBookingResendConfirmationEmail(emailData);
    if (sent) {
      console.log(`[Notion Webhook] ✅ Resend confirmation email sent for ${bookingId} (total: ${prevCount + 1})`);
      countUpdates['Confirmation Sent Count'] = { number: prevCount + 1 };
    } else {
      console.error(`[Notion Webhook] ❌ Resend confirmation email FAILED for ${bookingId}`);
    }
  }

  if (sendReminder) {
    const prevCount = extractNumber(props['Reminder Sent Count']) || 0;
    const sent = await sendBookingReminderEmail(emailData);
    if (sent) {
      console.log(`[Notion Webhook] ✅ Reminder email sent for ${bookingId} (total: ${prevCount + 1})`);
      countUpdates['Reminder Sent Count'] = { number: prevCount + 1 };
    } else {
      console.error(`[Notion Webhook] ❌ Reminder email FAILED for ${bookingId}`);
    }
  }

  // ── STEP 4: Update sent counts (separate PATCH — checkboxes already reset) ─
  if (Object.keys(countUpdates).length > 0) {
    try {
      await updateNotionPage(pageId, countUpdates);
      console.log('[Notion Webhook] ✅ Sent counts updated:', JSON.stringify(countUpdates));
    } catch (err) {
      console.error('[Notion Webhook] ❌ Count update PATCH failed (emails were still sent):', err);
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
      // Log the full Notion error body so we can see exactly what was rejected
      let errorBody: any = {};
      try { errorBody = await response.json(); } catch {}
      console.error('[Notion Webhook] updateNotionPage failed:', response.status, response.statusText);
      console.error('[Notion Webhook] Notion error body:', JSON.stringify(errorBody, null, 2));
      console.error('[Notion Webhook] Properties attempted:', JSON.stringify(properties, null, 2));
      throw new Error(`Notion API error ${response.status}: ${errorBody?.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[Notion Webhook] Error updating Notion page:', error);
    throw error;
  }
}

/**
 * Handle a Notion page with Status = "Blocked" as a studio blocked time.
 * Creates a Google Calendar block event and writes the event ID back to Notion.
 */
async function handleBlockedTime(pageId: string, props: any, eventType: string) {
  const reason =
    extractText(props['Client Name']) ||
    extractText(props['Name']) ||
    extractText(props['Reason']) ||
    'Studio Block';

  const date = extractDate(props['Date']);
  if (!date) {
    console.warn('[Notion Webhook] Blocked time has no date, skipping.');
    return;
  }

  // Try to get specific time from the Time property
  const rawTime = props['Time'];
  let startTime: string | undefined;
  let endTime: string | undefined;

  if (rawTime?.date?.start && rawTime.date.start.includes('T')) {
    startTime = rawTime.date.start.match(/T(\d{2}:\d{2})/)?.[1];
    endTime = rawTime.date.end?.match(/T(\d{2}:\d{2})/)?.[1];
    if (startTime && !endTime) {
      // Default 1-hour block if no end
      const [h, m] = startTime.split(':').map(Number);
      const endMins = h * 60 + m + 60;
      endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;
    }
  }

  try {
    const eventId = await createBlockedCalendarEvent({ reason, date, startTime, endTime, notionPageId: pageId });
    if (eventId) {
      await updateNotionPage(pageId, {
        'Calendar Event ID': { rich_text: [{ text: { content: eventId } }] },
      });
      console.log(`[Notion Webhook] ✅ Blocked time synced to calendar: ${eventId}`);
    }
  } catch (err) {
    console.error('[Notion Webhook] Failed to sync blocked time to calendar:', err);
  }
}
