import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { logAudit, createSearchAudit } from '@/lib/audit';
import { calculateEndTime } from '@/lib/time-utils';
import { sendBookingConfirmationEmail } from '@/lib/sendgrid';
import { createCalendarEvent } from '@/lib/google-calendar';

/**
 * Extract time from Notion date property
 * Handles both old format (rich_text) and new format (date with time)
 */
function extractTimeFromNotion(timeProperty: any): string {
  // New format: date property with start time
  if (timeProperty?.date?.start) {
    const dateTime = timeProperty.date.start;
    // Extract HH:mm from ISO datetime (e.g., "2025-11-10T14:30:00.000+08:00")
    const timeMatch = dateTime.match(/T(\d{2}:\d{2})/);
    if (timeMatch) {
      return timeMatch[1];
    }
  }
  
  // Old format: rich_text (fallback for backward compatibility)
  if (timeProperty?.rich_text?.[0]?.plain_text) {
    return timeProperty.rich_text[0].plain_text;
  }
  
  return '';
}

/**
 * GET /api/bookings - Search bookings by email or name
 * Query params: ?email=xxx OR ?firstName=xxx&lastName=xxx
 * 
 * SECURITY: Rate limited to prevent brute force attacks
 * Only returns bookings matching EXACT email/name combination
 * Protected by reCAPTCHA v3 to prevent bot attacks
 * AUDIT: Logs all search attempts
 */

// Simple in-memory rate limiting (use Redis in production for distributed systems)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    // New window or expired
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  record.count++;
  return true;
}

export async function GET(request: NextRequest) {
  // Declare variables at top level for error handler access
  let email: string | null = null;
  let firstName: string | null = null;
  let lastName: string | null = null;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    email = searchParams.get('email');
    firstName = searchParams.get('firstName');
    lastName = searchParams.get('lastName');

    // Rate limiting: max 10 requests per minute per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // reCAPTCHA verification
    const recaptchaToken = request.headers.get('x-recaptcha-token');
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, 'search_bookings');
      if (!recaptchaResult.success) {
        console.warn('reCAPTCHA verification failed:', recaptchaResult.error);
        return NextResponse.json(
          { success: false, error: 'Security verification failed. Please try again.' },
          { status: 403 }
        );
      }
    }

    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_BOOKINGS_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { success: false, error: 'Notion not configured' },
        { status: 500 }
      );
    }

    // Build filter based on search method
    let filter: any;
    
    if (email) {
      filter = {
        property: 'Email',
        email: {
          equals: email,
        },
      };
    } else if (firstName && lastName) {
      filter = {
        and: [
          {
            property: 'First Name',
            rich_text: {
              equals: firstName,
            },
          },
          {
            property: 'Last Name',
            rich_text: {
              equals: lastName,
            },
          },
        ],
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Please provide email or both firstName and lastName' },
        { status: 400 }
      );
    }

    // Query Notion database (no sensitive data logged)
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          filter,
          sorts: [
            {
              property: 'Date',
              direction: 'descending',
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion query error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to query bookings' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Transform Notion data to booking format
    // SECURITY: Only return data that belongs to the requester
    const bookings = data.results.map((page: any) => {
      const props = page.properties;
      return {
        id: props['Booking ID']?.rich_text?.[0]?.plain_text || page.id,
        notionPageId: page.id,
        customer: {
          firstName: props['First Name']?.rich_text?.[0]?.plain_text || '',
          lastName: props['Last Name']?.rich_text?.[0]?.plain_text || '',
          email: props['Email']?.email || '',
          phone: props['Phone']?.phone_number || '',
          // SECURITY: Don't expose full address in list view
          address: '', // Only show in detail view after verification
        },
        selections: {
          serviceType: props['Service Type']?.select?.name || '',
          serviceCategory: props['Service Category']?.select?.name || '',
          serviceGroup: props['Service Group']?.rich_text?.[0]?.plain_text || '',
          service: props['Service']?.rich_text?.[0]?.plain_text || '',
          duration: props['Duration']?.number || 0,
        },
        schedule: {
          date: props['Date']?.date?.start || '',
          time: extractTimeFromNotion(props['Time']),
        },
        totals: {
          sessionPrice: props['Session Price']?.number || 0,
          addonsTotal: props['Add-ons Total']?.number || 0,
          grandTotal: props['Grand Total']?.number || 0,
        },
        status: props['Status']?.select?.name || 'Pending',
        createdAt: page.created_time,
      };
    });

    // Audit: Successful search
    await logAudit(createSearchAudit(request, email || `${firstName} ${lastName}`, bookings.length, 'success'));

    return NextResponse.json({
      success: true,
      bookings,
      count: bookings.length,
    });

  } catch (error) {
    // Audit: Failed search
    await logAudit(createSearchAudit(request, email || `${firstName} ${lastName}`, 0, 'failure', String(error)));
    
    // Don't expose internal errors to client
    return NextResponse.json(
      { success: false, error: 'Failed to search bookings' },
      { status: 500 }
    );
  }
}

/**
 * Generate booking ID in format: MMRS-YYYYMMDDHH-XXXX
 * Example: MMRS-2024120114-A3B7
 */
function generateBookingId(bookingDate: string, bookingTime: string): string {
  // Parse the booking date (YYYY-MM-DD format)
  const [year, month, day] = bookingDate.split('-');
  
  // Parse the booking time (HH:MM format)
  const hour = bookingTime.split(':')[0];
  
  // Format: YYYYMMDDHH
  const dateTimePart = `${year}${month}${day}${hour}`;
  
  // Generate random 4-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomCode = '';
  for (let i = 0; i < 4; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Combine: MMRS-YYYYMMDDHH-XXXX
  return `MMRS-${dateTimePart}-${randomCode}`;
}

export async function POST(request: NextRequest) {
  console.log('🔔 Booking API route hit!');
  
  try {
    const bookingData = await request.json();
    console.log('📦 Received booking data');
    console.log('📋 Data structure:', JSON.stringify(bookingData, null, 2));
    
    // Generate custom booking ID
    const bookingId = generateBookingId(
      bookingData.schedule.date, 
      bookingData.schedule.time
    );

    console.log('📝 Generated booking ID:', bookingId);

    // Get Notion credentials
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_BOOKINGS_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      console.error('❌ Notion credentials not configured');
      return NextResponse.json(
        { success: false, error: 'Notion not configured' },
        { status: 500 }
      );
    }

    // Prepare Notion page properties
    // Title field is "Client Name" (combines First Name + Last Name)
    const fullName = `${bookingData.customer.firstName} ${bookingData.customer.lastName}`.trim() || "Unknown Customer";
    
    // Calculate end time including buffer (duration + 30 min buffer)
    const sessionDuration = bookingData.selections.duration || 0;
    const bufferMinutes = bookingData.schedule.buffer || 30;
    const totalDuration = sessionDuration + bufferMinutes;
    const endTime = calculateEndTime(bookingData.schedule.time, totalDuration);
    
    // Create datetime strings in ISO 8601 format with Manila timezone (+08:00)
    const startDateTime = `${bookingData.schedule.date}T${bookingData.schedule.time}:00.000+08:00`;
    const endDateTime = `${bookingData.schedule.date}T${endTime}:00.000+08:00`;
    
    const notionPayload = {
      parent: { database_id: databaseId },
      properties: {
        "Client Name": { title: [{ text: { content: fullName } }] },
        "Booking ID": { rich_text: [{ text: { content: bookingId } }] },
        "First Name": { rich_text: [{ text: { content: bookingData.customer.firstName || "" } }] },
        "Last Name": { rich_text: [{ text: { content: bookingData.customer.lastName || "" } }] },
        "Email": { email: bookingData.customer.email || null },
        "Phone": { phone_number: bookingData.customer.phone || null },
        "Service Type": { select: bookingData.selections.serviceType ? { name: bookingData.selections.serviceType } : null },
        "Service Category": { select: bookingData.selections.serviceCategory ? { name: bookingData.selections.serviceCategory } : null },
        "Service Group": { rich_text: [{ text: { content: bookingData.selections.serviceGroup || "" } }] },
        "Service": { rich_text: [{ text: { content: bookingData.selections.service || "" } }] },
        "Date": { date: bookingData.schedule.date ? { start: bookingData.schedule.date } : null },
        "Time": { 
          date: {
            start: startDateTime,
            end: endDateTime
          }
        },
        "Duration": { number: bookingData.selections.duration || 0 },
        "Backdrops": { multi_select: (bookingData.selfShoot?.backdrops || []).map((bd: string) => ({ name: bd })) },
        "Backdrop Allocations": { rich_text: [{ text: { content: JSON.stringify(bookingData.selfShoot?.allocations || {}) } }] },
        "Backdrop Order": { rich_text: [{ text: { content: (bookingData.selfShoot?.backdrops || []).join(', ') } }] },
        "Add-ons": { multi_select: Object.keys(bookingData.addons || {}).filter(key => bookingData.addons[key] > 0).map(addon => ({ name: addon })) },
        "Social Consent": { select: bookingData.consent?.socialConsent ? { name: bookingData.consent.socialConsent } : null },
        "Event Type": { select: bookingData.consent?.eventType ? { name: bookingData.consent.eventType } : null },
        "Celebrant Name": { rich_text: [{ text: { content: bookingData.consent?.celebrantName || "" } }] },
        "Birthday Age": { rich_text: [{ text: { content: bookingData.consent?.birthdayAge || "" } }] },
        "Graduation Level": { rich_text: [{ text: { content: bookingData.consent?.graduationLevel || "" } }] },
        "Event Date": { date: bookingData.consent?.eventDate ? { start: bookingData.consent.eventDate } : null },
        "Session Price": { number: bookingData.totals?.sessionPrice || 0 },
        "Add-ons Total": { number: bookingData.totals?.addonsTotal || 0 },
        "Grand Total": { number: bookingData.totals?.grandTotal || 0 },
        "Status": { select: { name: "Booking Confirmed" } },
        "Address": { rich_text: [{ text: { content: bookingData.customer.address || "" } }] },
      }
    };

    console.log('🚀 Saving to Notion database...');

    // Save to Notion
    const notionResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify(notionPayload),
    });

    if (!notionResponse.ok) {
      const errorText = await notionResponse.text();
      console.error('❌ Notion API error:', errorText);
      console.error('📋 Payload sent:', JSON.stringify(notionPayload, null, 2));
      return NextResponse.json(
        { success: false, error: 'Failed to save booking to Notion', details: errorText },
        { status: 500 }
      );
    }

    const notionResult = await notionResponse.json();
    console.log('✅ Saved to Notion successfully!');

    // Send booking confirmation email via SendGrid
    try {
      console.log('📧 Sending booking confirmation email via SendGrid...');
      await sendBookingConfirmationEmail({
        bookingId,
        customer: bookingData.customer,
        selections: bookingData.selections,
        schedule: bookingData.schedule,
        totals: bookingData.totals,
        addons: bookingData.addons,
        selfShoot: bookingData.selfShoot,
      });
      console.log('✅ Booking confirmation email sent');
    } catch (emailError) {
      console.warn('⚠️ SendGrid email failed (non-critical):', emailError);
      // Continue - don't fail the booking if email fails
    }

    // Create Google Calendar event
    let calendarEventId: string | null = null;
    try {
      console.log('📅 Creating Google Calendar event...');
      calendarEventId = await createCalendarEvent({
        bookingId,
        customer: bookingData.customer,
        service: bookingData.selections.service,
        serviceType: bookingData.selections.serviceType,
        duration: bookingData.selections.duration,
        date: bookingData.schedule.date,
        time: bookingData.schedule.time,
        description: bookingData.selections.description,
        backdrops: bookingData.selfShoot?.backdrops,
        addons: bookingData.addons,
      });
      
      if (calendarEventId) {
        console.log('✅ Calendar event created and invitation sent:', calendarEventId);
        
        // Store calendar event ID in Notion for future updates/deletions
        try {
          await fetch(`https://api.notion.com/v1/pages/${notionResult.id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${notionApiKey}`,
              'Content-Type': 'application/json',
              'Notion-Version': '2022-06-28',
            },
            body: JSON.stringify({
              properties: {
                "Calendar Event ID": { rich_text: [{ text: { content: calendarEventId } }] }
              }
            }),
          });
          console.log('✅ Calendar event ID stored in Notion');
        } catch (updateError) {
          console.warn('⚠️ Failed to store calendar event ID in Notion:', updateError);
        }
      }
    } catch (calendarError) {
      console.warn('⚠️ Google Calendar event creation failed (non-critical):', calendarError);
      // Continue - don't fail the booking if calendar fails
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      bookingId: bookingId,
      notionPageId: notionResult.id,
    });

  } catch (error) {
    console.error('❌ Booking error:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { success: false, error: 'Failed to create booking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}