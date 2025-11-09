/**
 * OTP (One-Time Password) Management System
 * Generates and verifies 6-digit codes for email verification
 */

interface OTPRecord {
  code: string;
  email: string;
  bookingId: string;
  expiresAt: number;
  attempts: number;
}

// In-memory storage (use Redis in production for distributed systems)
const otpStore = new Map<string, OTPRecord>();

// Configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5; // Maximum verification attempts
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Clean up expired OTPs every 5 minutes

/**
 * Generate a random 6-digit OTP code
 */
export function generateOTPCode(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString();
}

/**
 * Create and store an OTP for a booking verification
 * @returns The generated OTP code and expiry timestamp
 */
export function createOTP(email: string, bookingId: string): { code: string; expiresAt: number } {
  // Generate unique key for this email + booking combination
  const key = `${email.toLowerCase()}:${bookingId}`;
  
  // Invalidate any existing OTP for this combination
  otpStore.delete(key);
  
  // Generate new OTP
  const code = generateOTPCode();
  const expiresAt = Date.now() + OTP_EXPIRY_MS;
  
  // Store OTP record
  otpStore.set(key, {
    code,
    email: email.toLowerCase(),
    bookingId,
    expiresAt,
    attempts: 0,
  });
  
  console.log(`[OTP] Created for ${email}:${bookingId} - Expires in ${OTP_EXPIRY_MS / 60000} minutes`);
  
  return { code, expiresAt };
}

/**
 * Verify an OTP code
 * @returns Success status and error message if failed
 */
export function verifyOTP(
  email: string,
  bookingId: string,
  code: string
): { success: boolean; error?: string } {
  const key = `${email.toLowerCase()}:${bookingId}`;
  const record = otpStore.get(key);
  
  // Check if OTP exists
  if (!record) {
    console.warn(`[OTP] Verification failed: No OTP found for ${email}:${bookingId}`);
    return { success: false, error: 'No verification code found. Please request a new code.' };
  }
  
  // Check if expired
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    console.warn(`[OTP] Verification failed: Expired for ${email}:${bookingId}`);
    return { success: false, error: 'Verification code has expired. Please request a new code.' };
  }
  
  // Check max attempts
  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    console.warn(`[OTP] Verification failed: Max attempts exceeded for ${email}:${bookingId}`);
    return { success: false, error: 'Too many failed attempts. Please request a new code.' };
  }
  
  // Increment attempts
  record.attempts++;
  
  // Verify code
  if (record.code !== code.trim()) {
    console.warn(`[OTP] Verification failed: Invalid code for ${email}:${bookingId} (Attempt ${record.attempts}/${MAX_ATTEMPTS})`);
    return { 
      success: false, 
      error: `Invalid code. ${MAX_ATTEMPTS - record.attempts} attempts remaining.` 
    };
  }
  
  // Success - delete OTP to prevent reuse
  otpStore.delete(key);
  console.log(`[OTP] Verification successful for ${email}:${bookingId}`);
  
  return { success: true };
}

/**
 * Get remaining time for an OTP (in milliseconds)
 */
export function getOTPTimeRemaining(email: string, bookingId: string): number {
  const key = `${email.toLowerCase()}:${bookingId}`;
  const record = otpStore.get(key);
  
  if (!record) return 0;
  
  const remaining = record.expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Check if an OTP exists and is valid
 */
export function otpExists(email: string, bookingId: string): boolean {
  const key = `${email.toLowerCase()}:${bookingId}`;
  const record = otpStore.get(key);
  
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key);
    return false;
  }
  
  return true;
}

/**
 * Clean up expired OTPs (run periodically)
 */
export function cleanupExpiredOTPs(): void {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, record] of otpStore.entries()) {
    if (now > record.expiresAt) {
      otpStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[OTP] Cleaned up ${cleaned} expired OTP(s)`);
  }
}

// Start automatic cleanup
if (typeof window === 'undefined') {
  // Only run cleanup on server-side
  setInterval(cleanupExpiredOTPs, CLEANUP_INTERVAL_MS);
  console.log('[OTP] Automatic cleanup started (every 5 minutes)');
}

/**
 * Get OTP configuration (for frontend display)
 */
export function getOTPConfig() {
  return {
    length: OTP_LENGTH,
    expiryMinutes: OTP_EXPIRY_MS / 60000,
    maxAttempts: MAX_ATTEMPTS,
  };
}
