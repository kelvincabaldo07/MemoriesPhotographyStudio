import { NextRequest, NextResponse } from 'next/server';

// GET booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const bookingId = params.id;
  
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
  { params }: { params: { id: string } }
) {
  const bookingId = params.id;
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

// DELETE (cancel) booking by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const bookingId = params.id;
  
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