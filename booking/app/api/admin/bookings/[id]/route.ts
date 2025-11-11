import { NextRequest, NextResponse } from 'next/server';
import { calculateEndTime } from '@/lib/time-utils';

/**
 * PATCH (update) booking by ID - Admin endpoint
 * No email verification required (admin authenticated via session)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  
  try {
    const body = await request.json();
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_BOOKINGS_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { error: "Notion API credentials not configured" },
        { status: 500 }
      );
    }

    // First, find the booking by Booking ID to get the Notion page ID
    const queryResponse = await fetch(
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
            property: 'Booking ID',
            rich_text: {
              equals: bookingId,
            },
          },
        }),
      }
    );

    if (!queryResponse.ok) {
      return NextResponse.json(
        { error: "Failed to find booking" },
        { status: 404 }
      );
    }

    const queryData = await queryResponse.json();
    
    if (queryData.results.length === 0) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const notionPageId = queryData.results[0].id;
    const oldProps = queryData.results[0].properties;
    
    // Get duration for time calculation
    const duration = oldProps.Duration?.number || 60;
    const bufferMinutes = 30; // Standard buffer

    // Build Notion properties update object
    const notionProperties: any = {};

    // Handle status update
    if (body.status) {
      notionProperties.Status = {
        select: { name: body.status }
      };
    }

    // Handle name update (updates both "Client Name" title and first/last name fields)
    if (body.name) {
      notionProperties["Client Name"] = {
        title: [{ text: { content: body.name } }]
      };
      
      // Split name into first and last if provided
      const nameParts = body.name.split(' ');
      if (nameParts.length >= 2) {
        notionProperties["First Name"] = {
          rich_text: [{ text: { content: nameParts[0] } }]
        };
        notionProperties["Last Name"] = {
          rich_text: [{ text: { content: nameParts.slice(1).join(' ') } }]
        };
      }
    }

    // Handle individual first/last name updates
    if (body.firstName) {
      notionProperties["First Name"] = {
        rich_text: [{ text: { content: body.firstName } }]
      };
    }

    if (body.lastName) {
      notionProperties["Last Name"] = {
        rich_text: [{ text: { content: body.lastName } }]
      };
    }

    if (body.email) {
      notionProperties.Email = {
        email: body.email
      };
    }

    if (body.phone) {
      notionProperties.Phone = {
        phone_number: body.phone
      };
    }

    if (body.address) {
      notionProperties.Address = {
        rich_text: [{ text: { content: body.address } }]
      };
    }

    if (body.date) {
      notionProperties.Date = {
        date: { start: body.date }
      };
    }

    if (body.time) {
      // Calculate end time including buffer
      const totalDuration = duration + bufferMinutes;
      const endTime = calculateEndTime(body.time, totalDuration);
      
      // Use the provided date or get from old properties
      const dateForTime = body.date || oldProps.Date?.date?.start || new Date().toISOString().split('T')[0];
      
      // Create datetime strings with Manila timezone
      const startDateTime = `${dateForTime}T${body.time}:00.000+08:00`;
      const endDateTime = `${dateForTime}T${endTime}:00.000+08:00`;
      
      notionProperties.Time = {
        date: {
          start: startDateTime,
          end: endDateTime,
          time_zone: "Asia/Manila"
        }
      };
    }

    // Update Notion page
    const updateResponse = await fetch(
      `https://api.notion.com/v1/pages/${notionPageId}`,
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

    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      console.error('Notion update error:', errorData);
      return NextResponse.json(
        { error: "Failed to update booking in Notion", details: errorData },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully',
      bookingId,
    });
  } catch (error) {
    console.error('❌ Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update booking', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
