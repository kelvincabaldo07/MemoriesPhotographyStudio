import { NextRequest, NextResponse } from 'next/server';

// GET booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  
  // TODO: Fetch from your database (Notion, etc.)
  // For now, we'll return mock data
  
  return NextResponse.json({
    success: true,
    booking: {
      id: bookingId,
      schedule: {
        date: "2024-12-01",
        time: "10:00"
      },
      customer: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        phone: "123-456-7890"
      },
      selections: {
        service: "Solo/Duo 30",
        serviceType: "Self-Shoot",
        serviceCategory: "Digital"
      }
    }
  });
}

// PUT (update) booking by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const updates = await request.json();
  
  console.log('🔄 Updating booking:', bookingId);
  console.log('📝 Updates:', updates);
  
  try {
    // Send update to n8n
    const n8nWebhookUrl = 'https://n8n-production-f7c3.up.railway.app/webhook/booking-updated';
    
    await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'booking_updated',
        bookingId,
        updates,
      }),
    });
    
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

// PATCH (partial update) booking by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  const updates = await request.json();
  
  console.log('🔄 Patching booking:', bookingId);
  console.log('📝 Updates:', updates);
  
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

// DELETE (cancel) booking by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await params;
  
  console.log('🗑️ Cancelling booking:', bookingId);
  
  try {
    // Send cancellation to n8n
    const n8nWebhookUrl = 'https://n8n-production-f7c3.up.railway.app/webhook/booking-cancelled';
    
    await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'booking_cancelled',
        bookingId,
      }),
    });
    
    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('❌ Cancellation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}