import { NextRequest, NextResponse } from 'next/server';
import { createOTP, otpExists, getOTPConfig } from '@/lib/otp';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { logAudit, createOTPRequestAudit } from '@/lib/audit';
import { sendOTPEmail } from '@/lib/sendgrid';

/**
 * POST /api/otp/send - Generate and send OTP via email
 * Body: { email, bookingId }
 * 
 * SECURITY: Rate limited, reCAPTCHA protected, validates booking exists
 * AUDIT: Logs all OTP request attempts
 */

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests = 3, windowMs = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, bookingId } = body;

    // Validate input
    if (!email || !bookingId) {
      return NextResponse.json(
        { success: false, error: 'Email and booking ID are required' },
        { status: 400 }
      );
    }

    // Rate limiting: max 3 OTP requests per minute per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip, 3, 60000)) {
      // Audit: Blocked by rate limit
      await logAudit(createOTPRequestAudit(request, bookingId, email, 'blocked', 'Rate limit exceeded'));
      
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait before requesting another code.' },
        { status: 429 }
      );
    }

    // reCAPTCHA verification
    const recaptchaToken = request.headers.get('x-recaptcha-token');
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, 'request_otp');
      if (!recaptchaResult.success) {
        console.warn('reCAPTCHA verification failed:', recaptchaResult.error);
        // Audit: Blocked by reCAPTCHA
        await logAudit(createOTPRequestAudit(request, bookingId, email, 'blocked', 'reCAPTCHA verification failed'));
        
        return NextResponse.json(
          { success: false, error: 'Security verification failed. Please try again.' },
          { status: 403 }
        );
      }
    }

    // Check if booking exists with this email
    const notionApiKey = process.env.NOTION_API_KEY;
    const databaseId = process.env.NOTION_BOOKINGS_DATABASE_ID;

    if (!notionApiKey || !databaseId) {
      return NextResponse.json(
        { success: false, error: 'Service configuration error' },
        { status: 500 }
      );
    }

    // Verify booking exists and email matches
    const notionResponse = await fetch(
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
                  equals: email.toLowerCase(),
                },
              },
            ],
          },
        }),
      }
    );

    const notionData = await notionResponse.json();

    if (!notionData.results || notionData.results.length === 0) {
      // Audit: Failed OTP request
      await logAudit(createOTPRequestAudit(request, bookingId, email, 'failure', 'Booking not found or email does not match'));
      
      return NextResponse.json(
        { success: false, error: 'Booking not found or email does not match' },
        { status: 404 }
      );
    }

    // Generate OTP
    const { code, expiresAt } = createOTP(email, bookingId);

    // Audit: Successful OTP generation
    await logAudit(createOTPRequestAudit(request, bookingId, email, 'success'));

    // Send OTP via SendGrid
    try {
      console.log(`[OTP] Sending verification code to ${email} via SendGrid...`);
      await sendOTPEmail(email, code);
      console.log(`[OTP] ✅ Verification code sent successfully to ${email}`);
    } catch (error) {
      console.error('[OTP] ❌ Failed to send via SendGrid:', error);
      
      // Try n8n as fallback if configured
      const n8nWebhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      if (n8nWebhookUrl) {
        try {
          await fetch(n8nWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'otp_verification',
              data: {
                email,
                bookingId,
                otpCode: code,
                expiresAt: new Date(expiresAt).toISOString(),
                expiryMinutes: getOTPConfig().expiryMinutes,
              },
            }),
          });
          console.log(`[OTP] Sent via n8n fallback webhook`);
        } catch (n8nError) {
          console.error('[OTP] n8n fallback also failed:', n8nError);
        }
      }
      
      // In development, always show the code in console
      if (process.env.NODE_ENV === 'development') {
        console.log(`[OTP] 🔑 DEV MODE - Code for ${email}: ${code}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to your email',
      expiresAt,
      expiryMinutes: getOTPConfig().expiryMinutes,
      // Only return code in development
      ...(process.env.NODE_ENV === 'development' && { devCode: code }),
    });

  } catch (error) {
    console.error('[OTP] Send error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
