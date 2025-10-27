import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🔔 API route hit!');
  
  try {
    const bookingData = await request.json();
    console.log('📦 Received data:', JSON.stringify(bookingData, null, 2));
    
    // Add unique ID and timestamp
    const payload = {
      ...bookingData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };

    console.log('📝 Processing booking with ID:', payload.id);

    // Send to n8n webhook
    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    
    console.log('🔍 Environment check:');
    console.log('  - N8N_WEBHOOK_URL:', n8nWebhookUrl);
    
    if (!n8nWebhookUrl) {
      console.error('❌ N8N_WEBHOOK_URL not configured!');
      return NextResponse.json(
        { success: false, error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    console.log('🚀 Attempting to send to n8n:', n8nWebhookUrl);

    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'new_booking',
          data: payload
        }),
      });

      console.log('📡 n8n response status:', n8nResponse.status);
      
      if (!n8nResponse.ok) {
        const errorText = await n8nResponse.text();
        console.error('⚠️ n8n webhook failed!');
        console.error('  Status:', n8nResponse.status);
        console.error('  Response:', errorText);
      } else {
        const responseData = await n8nResponse.text();
        console.log('✅ Sent to n8n successfully!');
        console.log('  Response:', responseData);
      }
    } catch (n8nError) {
      console.error('💥 n8n webhook error:', n8nError);
      console.error('  Error details:', JSON.stringify(n8nError, null, 2));
      // Continue anyway - don't fail the booking
    }

    console.log('✅ Returning success to client');
    return NextResponse.json({
      success: true,
      message: 'Booking created successfully',
      bookingId: payload.id
    });

  } catch (error) {
    console.error('❌ Booking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}