import { NextRequest, NextResponse } from 'next/server';

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  console.log('🔔 Verify email API hit');
  
  try {
    const { email } = await request.json();
    console.log('📧 Email to verify:', email);
    
    if (!email || !email.includes('@')) {
      console.log('❌ Invalid email');
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const code = generateVerificationCode();
    console.log('✅ Generated code:', code);

    const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL?.replace('booking-created', 'send-verification');
    console.log('🔗 n8n URL:', n8nWebhookUrl);
    
    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'email_verification',
            email,
            code
          }),
        });
        console.log('✅ Sent to n8n');
      } catch (error) {
        console.error('⚠️ n8n error:', error);
      }
    }

    console.log('📤 Returning success');
    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      code: code
    });

  } catch (error) {
    console.error('💥 Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}