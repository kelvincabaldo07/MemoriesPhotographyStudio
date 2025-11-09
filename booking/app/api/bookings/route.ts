// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(request: NextRequest) {
//   console.log('🔔 API route hit!');
  
//   try {
//     const bookingData = await request.json();
//     console.log('📦 Received data:', JSON.stringify(bookingData, null, 2));
    
//     // Add unique ID and timestamp
//     const payload = {
//       ...bookingData,
//       id: Date.now().toString(),
//       createdAt: new Date().toISOString(),
//     };

//     console.log('📝 Processing booking with ID:', payload.id);

//     // Send to n8n webhook
//     const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    
//     console.log('🔍 Environment check:');
//     console.log('  - N8N_WEBHOOK_URL:', n8nWebhookUrl);
    
//     if (!n8nWebhookUrl) {
//       console.error('❌ N8N_WEBHOOK_URL not configured!');
//       return NextResponse.json(
//         { success: false, error: 'Webhook not configured' },
//         { status: 500 }
//       );
//     }

//     console.log('🚀 Attempting to send to n8n:', n8nWebhookUrl);

//     try {
//       const n8nResponse = await fetch(n8nWebhookUrl, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           event: 'new_booking',
//           data: payload
//         }),
//       });

//       console.log('📡 n8n response status:', n8nResponse.status);
      
//       if (!n8nResponse.ok) {
//         const errorText = await n8nResponse.text();
//         console.error('⚠️ n8n webhook failed!');
//         console.error('  Status:', n8nResponse.status);
//         console.error('  Response:', errorText);
//       } else {
//         const responseData = await n8nResponse.text();
//         console.log('✅ Sent to n8n successfully!');
//         console.log('  Response:', responseData);
//       }
//     } catch (n8nError) {
//       console.error('💥 n8n webhook error:', n8nError);
//       console.error('  Error details:', JSON.stringify(n8nError, null, 2));
//       // Continue anyway - don't fail the booking
//     }

//     console.log('✅ Returning success to client');
//     return NextResponse.json({
//       success: true,
//       message: 'Booking created successfully',
//       bookingId: payload.id
//     });

//   } catch (error) {
//     console.error('❌ Booking error:', error);
//     return NextResponse.json(
//       { success: false, error: 'Failed to create booking' },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/bookings - Search bookings by email or name
 * Query params: ?email=xxx OR ?firstName=xxx&lastName=xxx
 */
export async function GET(request: NextRequest) {
  console.log('🔍 GET bookings API called');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');

    console.log('Search params:', { email, firstName, lastName });

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

    console.log('Querying Notion with filter:', JSON.stringify(filter, null, 2));

    // Query Notion database
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
    console.log('Found bookings:', data.results.length);

    // Transform Notion data to booking format
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
          time: props['Time']?.rich_text?.[0]?.plain_text || '',
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

    return NextResponse.json({
      success: true,
      bookings,
      count: bookings.length,
    });

  } catch (error) {
    console.error('GET bookings error:', error);
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
        "Time": { rich_text: [{ text: { content: bookingData.schedule.time || "" } }] },
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
        "Status": { select: { name: "Pending" } },
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

    // Optionally: Also send to n8n webhook if configured (for emails, etc.)
    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        console.log('� Sending notification to n8n...');
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'new_booking',
            data: { ...bookingData, bookingId, notionPageId: notionResult.id }
          }),
        });
        console.log('✅ n8n notification sent');
      } catch (n8nError) {
        console.warn('⚠️ n8n notification failed (non-critical):', n8nError);
      }
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