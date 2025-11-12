import { NextRequest, NextResponse } from 'next/server';
import { sendEmailVerificationCode } from '@/lib/sendgrid';

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const code = generateVerificationCode();

    // Send verification email via SendGrid
    try {
      await sendEmailVerificationCode(email, code);
    } catch (emailError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('SendGrid email failed:', emailError);
      }
      
      // Try n8n as fallback if configured
      const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL?.replace('booking-created', 'send-verification');
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
        } catch (n8nError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('n8n fallback also failed:', n8nError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent',
      code: code
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Verify email error:', error);
    }
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}