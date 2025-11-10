import { NextRequest, NextResponse } from 'next/server';
import { sendEmailVerificationCode } from '@/lib/sendgrid';

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

    // Send verification email via SendGrid
    try {
      console.log('📧 Sending verification email via SendGrid...');
      await sendEmailVerificationCode(email, code);
      console.log('✅ Verification email sent successfully');
    } catch (emailError) {
      console.error('❌ SendGrid email failed:', emailError);
      
      // Try n8n as fallback if configured
      const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL?.replace('booking-created', 'send-verification');
      if (n8nWebhookUrl) {
        try {
          console.log('🔔 Attempting n8n fallback...');
          await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'email_verification',
              email,
              code
            }),
          });
          console.log('✅ Sent via n8n fallback');
        } catch (n8nError) {
          console.error('⚠️ n8n fallback also failed:', n8nError);
        }
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