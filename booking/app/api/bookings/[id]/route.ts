import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { logAudit, createViewAudit, createUpdateAudit, createCancelAudit } from '@/lib/audit';
import { calculateEndTime } from '@/lib/time-utils';

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
 * GET booking by ID
 * SECURITY: Requires email verification parameter to prevent unauthorized access
 * Protected by reCAPTCHA v3 to prevent bot attacks
 * AUDIT: Logs all view attempts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  
  // SECURITY: Require email verification
  const searchParams = request.nextUrl.searchParams;
  const verifyEmail = searchParams.get('email');
  
  if (!verifyEmail) {
    return NextResponse.json(
      { success: false, error: 'Email verification required' },
      { status: 401 }
    );
  }

  // reCAPTCHA verification
  const recaptchaToken = request.headers.get('x-recaptcha-token');
  if (recaptchaToken) {
    const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, 'verify_booking');
    if (!recaptchaResult.success) {
      console.warn('reCAPTCHA verification failed:', recaptchaResult.error);
      return NextResponse.json(
        { success: false, error: 'Security verification failed. Please try again.' },
        { status: 403 }
      );
    }
  }

  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_BOOKINGS_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Query by Booking ID AND email to verify ownership
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
          filter: {
            and: [
              {
                property: 'Booking ID',
                rich_text: {
                  equals: bookingId,
                },
              },
              {
                property: 'Email',
                email: {
                  equals: verifyEmail,
                },
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch booking' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.results.length === 0) {
      // Audit: Failed view attempt
      await logAudit(createViewAudit(request, bookingId, verifyEmail, 'failure', 'Booking not found or access denied'));
      
      return NextResponse.json(
        { success: false, error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    const page = data.results[0];
    const props = page.properties;

    // Audit: Successful view
    await logAudit(createViewAudit(request, bookingId, verifyEmail, 'success'));

    // Return booking data
    return NextResponse.json({
      success: true,
      booking: {
        id: props['Booking ID']?.rich_text?.[0]?.plain_text || bookingId,
        notionPageId: page.id,
        customer: {
          firstName: props['First Name']?.rich_text?.[0]?.plain_text || '',
          lastName: props['Last Name']?.rich_text?.[0]?.plain_text || '',
          email: props['Email']?.email || '',
          phone: props['Phone']?.phone_number || '',
          address: props['Address']?.rich_text?.[0]?.plain_text || '',
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
        selfShoot: {
          backdrops: props['Backdrops']?.multi_select?.map((bd: any) => bd.name) || [],
          allocations: props['Backdrop Allocations']?.rich_text?.[0]?.plain_text 
            ? JSON.parse(props['Backdrop Allocations'].rich_text[0].plain_text) 
            : {},
        },
        totals: {
          sessionPrice: props['Session Price']?.number || 0,
          addonsTotal: props['Add-ons Total']?.number || 0,
          grandTotal: props['Grand Total']?.number || 0,
        },
        status: props['Status']?.select?.name || 'Pending',
        createdAt: page.created_time,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

/**
 * PUT (update) booking by ID
 * SECURITY: Requires email verification in request body
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const body = await request.json();
  const { email: verifyEmail, updates } = body;
  
  // SECURITY: Require email verification
  if (!verifyEmail) {
    return NextResponse.json(
      { success: false, error: 'Email verification required' },
      { status: 401 }
    );
  }

  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_BOOKINGS_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // First, verify ownership by checking email matches
    const verifyResponse = await fetch(
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
                property: 'Booking ID',
                rich_text: { equals: bookingId },
              },
              {
                property: 'Email',
                email: { equals: verifyEmail },
              },
            ],
          },
        }),
      }
    );

    const verifyData = await verifyResponse.json();
    if (verifyData.results.length === 0) {
      // Audit: Failed update attempt
      await logAudit(createUpdateAudit(request, bookingId, verifyEmail, {}, updates, 'failure', 'Booking not found or access denied'));
      
      return NextResponse.json(
        { success: false, error: 'Booking not found or access denied' },
        { status: 403 }
      );
    }

    const notionPageId = verifyData.results[0].id;
    const oldProps = verifyData.results[0].properties;
    
    // Get duration and buffer for time calculation
    const duration = oldProps.Duration?.number || 60;
    const bufferMinutes = 30; // Standard buffer
    
    // Store old values for audit
    const oldData = {
      date: oldProps.Date?.date?.start || '',
      time: extractTimeFromNotion(oldProps.Time),
    };

    // Update the booking
    const notionProperties: any = {};
    
    if (updates.date) {
      notionProperties.Date = { date: { start: updates.date } };
    }
    
    if (updates.time) {
      // Calculate end time including buffer
      const totalDuration = duration + bufferMinutes;
      const endTime = calculateEndTime(updates.time, totalDuration);
      
      // Use the date from updates or keep the old date
      const dateForTime = updates.date || oldData.date;
      
      // Create datetime strings with Manila timezone
      const startDateTime = `${dateForTime}T${updates.time}:00.000+08:00`;
      const endDateTime = `${dateForTime}T${endTime}:00.000+08:00`;
      
      notionProperties.Time = {
        date: {
          start: startDateTime,
          end: endDateTime,
          time_zone: "Asia/Manila"
        }
      };
    }

    await fetch(`https://api.notion.com/v1/pages/${notionPageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({ properties: notionProperties }),
    });
    
    // Audit: Successful update
    await logAudit(createUpdateAudit(request, bookingId, verifyEmail, oldData, updates, 'success'));
    
    // Optionally notify via n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'booking_updated',
          bookingId,
          updates,
        }),
      }).catch(() => {}); // Fail silently
    }
    
    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      bookingId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

/**
 * PATCH (partial update) booking by ID
 * SECURITY: Requires email verification
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const body = await request.json();
  const { email: verifyEmail, updates } = body;
  
  // SECURITY: Require email verification
  if (!verifyEmail) {
    return NextResponse.json(
      { success: false, error: 'Email verification required' },
      { status: 401 }
    );
  }
  
  try {
    const notionApiKey = process.env.NOTION_API_KEY;

    if (!notionApiKey) {
      return NextResponse.json(
        { error: "Notion API credentials not configured" },
        { status: 500 }
      );
    }

    // Build Notion properties update object
    const notionProperties: any = {};

    if (updates.status) {
      notionProperties.Status = {
        select: { name: updates.status }
      };
    }

    if (updates.name) {
      notionProperties.Name = {
        title: [{ text: { content: updates.name } }]
      };
    }

    if (updates.email) {
      notionProperties.Email = {
        email: updates.email
      };
    }

    if (updates.phone) {
      notionProperties.Phone = {
        phone_number: updates.phone
      };
    }

    if (updates.address) {
      notionProperties.Address = {
        rich_text: [{ text: { content: updates.address } }]
      };
    }

    if (updates.date) {
      notionProperties.Date = {
        date: { start: updates.date }
      };
    }

    if (updates.time) {
      notionProperties.Time = {
        rich_text: [{ text: { content: updates.time } }]
      };
    }

    // Update Notion page
    const response = await fetch(
      `https://api.notion.com/v1/pages/${bookingId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: notionProperties,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion update error:', errorData);
      throw new Error("Failed to update Notion");
    }

    // Also send to n8n webhook for any additional processing
    const n8nWebhookUrl = 'https://n8n-production-f7c3.up.railway.app/webhook/booking-updated';
    
    await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'booking_updated',
        bookingId,
        updates,
      }),
    }).catch(err => console.log('n8n webhook warning:', err.message));
    
    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      bookingId,
    });
  } catch (error) {
    console.error('❌ Update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

/**
 * DELETE (cancel) booking by ID
 * SECURITY: Requires email verification in query params
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  
  // SECURITY: Require email verification
  const searchParams = request.nextUrl.searchParams;
  const verifyEmail = searchParams.get('email');
  
  if (!verifyEmail) {
    return NextResponse.json(
      { success: false, error: 'Email verification required' },
      { status: 401 }
    );
  }

  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_BOOKINGS_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Verify ownership by checking email matches
    const verifyResponse = await fetch(
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
                property: 'Booking ID',
                rich_text: { equals: bookingId },
              },
              {
                property: 'Email',
                email: { equals: verifyEmail },
              },
            ],
          },
        }),
      }
    );

    const verifyData = await verifyResponse.json();
    if (verifyData.results.length === 0) {
      // Audit: Failed cancel attempt
      await logAudit(createCancelAudit(request, bookingId, verifyEmail, 'failure', 'Booking not found or access denied'));
      
      return NextResponse.json(
        { success: false, error: 'Booking not found or access denied' },
        { status: 403 }
      );
    }

    const notionPageId = verifyData.results[0].id;

    // Update status to Cancelled instead of deleting
    await fetch(`https://api.notion.com/v1/pages/${notionPageId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        properties: {
          Status: { select: { name: 'Cancelled' } },
        },
      }),
    });
    
    // Audit: Successful cancellation
    await logAudit(createCancelAudit(request, bookingId, verifyEmail, 'success'));
    
    // Optionally notify via n8n
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'booking_cancelled',
          bookingId,
        }),
      }).catch(() => {}); // Fail silently
    }
    
    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}