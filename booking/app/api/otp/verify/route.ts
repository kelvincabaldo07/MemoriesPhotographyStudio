import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { logAudit, createOTPVerifyAudit } from '@/lib/audit';

/**
 * POST /api/otp/verify - Verify OTP code
 * Body: { email, bookingId, code }
 * 
 * SECURITY: Rate limited, reCAPTCHA protected, max 5 attempts per OTP
 * AUDIT: Logs all verification attempts
 */

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string, maxRequests = 10, windowMs = 60000): boolean {
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
  // Declare variables at top level for error handler access
  let email: string = '';
  let bookingId: string = '';
  
  try {
    const body = await request.json();
    email = body.email;
    bookingId = body.bookingId;
    const code = body.code;

    // Validate input
    if (!email || !bookingId || !code) {
      return NextResponse.json(
        { success: false, error: 'Email, booking ID, and code are required' },
        { status: 400 }
      );
    }

    // Rate limiting: max 10 verification attempts per minute per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip, 10, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // reCAPTCHA verification (optional but recommended)
    const recaptchaToken = request.headers.get('x-recaptcha-token');
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptchaToken(recaptchaToken, 'verify_otp');
      if (!recaptchaResult.success) {
        console.warn('reCAPTCHA verification failed:', recaptchaResult.error);
        return NextResponse.json(
          { success: false, error: 'Security verification failed. Please try again.' },
          { status: 403 }
        );
      }
    }

    // Verify OTP
    const result = verifyOTP(email, bookingId, code);

    if (!result.success) {
      // Extract attempts remaining from error message
      const attemptsMatch = result.error?.match(/(\d+) attempts remaining/);
      const attemptsRemaining = attemptsMatch ? parseInt(attemptsMatch[1]) : 0;
      
      // Audit: Failed verification attempt
      await logAudit(createOTPVerifyAudit(request, bookingId, email, attemptsRemaining, 'failure', result.error));
      
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Audit: Successful verification
    await logAudit(createOTPVerifyAudit(request, bookingId, email, 0, 'success'));

    return NextResponse.json({
      success: true,
      message: 'Verification successful',
    });

  } catch (error) {
    console.error('[OTP] Verify error:', error);
    // Audit: System error
    await logAudit(createOTPVerifyAudit(request, bookingId, email, 0, 'failure', String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
