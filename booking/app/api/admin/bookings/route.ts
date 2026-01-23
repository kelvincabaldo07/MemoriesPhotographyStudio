import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAudit } from '@/lib/audit';
import { calculateEndTime } from '@/lib/time-utils';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { createCalendarEvent } from '@/lib/google-calendar';
import { randomBytes } from 'crypto';

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

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_BOOKINGS_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { error: "Notion API credentials not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sorts: [
            {
              property: "Date",
              direction: "descending",
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Notion");
    }

    const data = await response.json();

    // Transform Notion data to a simpler format
    const bookings = data.results.map((page: any) => {
      const props = page.properties;
      const firstName = props["First Name"]?.rich_text?.[0]?.plain_text || "";
      const lastName = props["Last Name"]?.rich_text?.[0]?.plain_text || "";
      const fullName = `${firstName} ${lastName}`.trim() || props.Name?.title?.[0]?.plain_text || "";
      
      return {
        id: page.id, // Notion page ID
        bookingId: props["Booking ID"]?.rich_text?.[0]?.plain_text || "", // Booking ID (MMRS-xxx)
        name: fullName,
        firstName,
        lastName,
        email: props.Email?.email || "",
        phone: props.Phone?.phone_number || "",
        address: props.Address?.rich_text?.[0]?.plain_text || "",
        serviceType: props["Service Type"]?.select?.name || "",
        serviceCategory: props["Service Category"]?.select?.name || "",
        serviceGroup: props["Service Group"]?.rich_text?.[0]?.plain_text || "",
        service: props.Service?.rich_text?.[0]?.plain_text || "",
        date: props.Date?.date?.start || "",
        time: extractTimeFromNotion(props.Time),
        duration: props.Duration?.number || 0,
        backdrops: props.Backdrops?.multi_select?.map((b: any) => b.name) || [],
        backdropAllocations: props["Backdrop Allocations"]?.rich_text?.[0]?.plain_text || "",
        backdropOrder: props["Backdrop Order"]?.rich_text?.[0]?.plain_text || "",
        addons: props["Add-ons"]?.multi_select?.map((a: any) => a.name) || [],
        socialConsent: props["Social Consent"]?.select?.name || "",
        eventType: props["Event Type"]?.select?.name || "",
        celebrantName: props["Celebrant Name"]?.rich_text?.[0]?.plain_text || "",
        birthdayAge: props["Birthday Age"]?.rich_text?.[0]?.plain_text || "",
        graduationLevel: props["Graduation Level"]?.rich_text?.[0]?.plain_text || "",
        eventDate: props["Event Date"]?.date?.start || "",
        sessionPrice: props["Session Price"]?.number || 0,
        addonsTotal: props["Add-ons Total"]?.number || 0,
        grandTotal: props["Grand Total"]?.number || 0,
        status: props.Status?.select?.name || "Pending",
        createdAt: page.created_time,
      };
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

/**
 * Generate cryptographically secure booking ID in format: MMRS-YYYYMMDDHH-XXXXXXXX
 */
function generateBookingId(bookingDate: string, bookingTime: string): string {
  const [year, month, day] = bookingDate.split('-');
  const hour = bookingTime.split(':')[0];
  const dateTimePart = `${year}${month}${day}${hour}`;
  
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytesBuffer = randomBytes(6);
  let randomCode = '';
  for (let i = 0; i < 8; i++) {
    const randomIndex = randomBytesBuffer[i % 6] % chars.length;
    randomCode += chars.charAt(randomIndex);
  }
  
  return `MMRS-${dateTimePart}-${randomCode}`;
}

/**
 * POST /api/admin/bookings - Create booking on behalf of customer
 * SECURITY: Requires admin authentication
 * FEATURES: 
 * - Skip email verification
 * - Allow off-hours booking
 * - Double-booking check with override option
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🔐 Admin booking request by:', session.user?.email);
    
    const bookingData = await request.json();
    console.log('📦 Admin booking data received');
    
    // Generate booking ID
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

    // Always check for double-booking to prevent conflicts
    // Check if time slot is already booked
    const existingBookingsResponse = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
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
                property: 'Date',
                date: {
                  equals: bookingData.schedule.date
                }
              },
              {
                property: 'Status',
                select: {
                  does_not_equal: 'Cancelled'
                }
              }
            ]
          }
        })
      }
    );

    if (existingBookingsResponse.ok) {
      const existingData = await existingBookingsResponse.json();
      const requestedTime = bookingData.schedule.time;
      const requestedDuration = bookingData.selections.duration || 30;
      
      // Check for time conflicts
      const hasConflict = existingData.results.some((page: any) => {
        const existingTimeData = page.properties.Time?.date;
        if (!existingTimeData?.start) return false;
        
        const existingTime = existingTimeData.start.match(/T(\d{2}:\d{2})/)?.[1];
        if (!existingTime) return false;
        
        const existingDuration = page.properties.Duration?.number || 30;
        
        // Convert times to minutes for comparison
        const [reqH, reqM] = requestedTime.split(':').map(Number);
        const reqStart = reqH * 60 + reqM;
        const reqEnd = reqStart + requestedDuration + 30; // Include buffer
        
        const [exH, exM] = existingTime.split(':').map(Number);
        const exStart = exH * 60 + exM;
        const exEnd = exStart + existingDuration + 30; // Include buffer
        
        // Check for overlap
        return (reqStart < exEnd && reqEnd > exStart);
      });
      
      if (hasConflict) {
        return NextResponse.json(
          { success: false, error: 'Time slot is already booked. Please choose a different time.' },
          { status: 409 }
        );
      }
    }

    // Prepare Notion page properties
    const fullName = `${bookingData.customer.firstName} ${bookingData.customer.lastName}`.trim() || "Unknown Customer";
    
    // Calculate end time including buffer
    const sessionDuration = bookingData.selections.duration || 0;
    const bufferMinutes = 30;
    const totalDuration = sessionDuration + bufferMinutes;
    const endTime = calculateEndTime(bookingData.schedule.time, totalDuration);
    
    // Create datetime strings in ISO 8601 format with Manila timezone
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
        "Session Price": { number: bookingData.totals?.sessionPrice || 0 },
        "Add-ons Total": { number: bookingData.totals?.addonsTotal || 0 },
        "Grand Total": { number: bookingData.totals?.grandTotal || 0 },
        "Status": { select: { name: "Booking Confirmed" } },
        "Booked By": { rich_text: [{ text: { content: `Admin: ${session.user?.email || 'Unknown'}` } }] },
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
      return NextResponse.json(
        { success: false, error: 'Failed to save booking to Notion', details: errorText },
        { status: 500 }
      );
    }

    const notionResult = await notionResponse.json();

    // Send booking confirmation email
    try {
      console.log('📧 Sending confirmation email...');
      await sendBookingConfirmationEmail({
        bookingId,
        customer: bookingData.customer,
        selections: bookingData.selections,
        schedule: bookingData.schedule,
        totals: bookingData.totals,
        addons: bookingData.addons,
        selfShoot: bookingData.selfShoot,
      });
      console.log('✅ Confirmation email sent');
    } catch (emailError) {
      console.warn('⚠️ Email failed (non-critical):', emailError);
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
        serviceCategory: bookingData.selections.serviceCategory,
        serviceGroup: bookingData.selections.serviceGroup,
        duration: bookingData.selections.duration,
        date: bookingData.schedule.date,
        time: bookingData.schedule.time,
        description: bookingData.selections.description,
        backdrops: bookingData.selfShoot?.backdrops,
        addons: bookingData.addons,
      });
      
      if (calendarEventId) {
        console.log('✅ Calendar event created:', calendarEventId);
        
        // Store calendar event ID in Notion
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
        } catch (updateError) {
          console.warn('⚠️ Failed to store calendar event ID:', updateError);
        }
      }
    } catch (calendarError) {
      console.warn('⚠️ Calendar event creation failed (non-critical):', calendarError);
    }

    // Audit log
    try {
      await logAudit({
        timestamp: new Date().toISOString(),
        action: 'create',
        bookingId: bookingId,
        email: bookingData.customer.email,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        metadata: {
          adminBooking: true,
          adminUser: session.user?.email || 'unknown',
          service: bookingData.selections.service,
          date: bookingData.schedule.date,
          time: bookingData.schedule.time,
          offHoursOverride: bookingData.allowOffHours || false,
        },
      });
    } catch (auditError) {
      console.warn('⚠️ Audit logging failed:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      bookingId: bookingId,
      notionPageId: notionResult.id,
    });

  } catch (error) {
    console.error('❌ Admin booking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
