/**
 * Audit Logging System
 * Logs all booking operations for security monitoring and compliance
 */

import { Client } from '@notionhq/client';

interface AuditLogEntry {
  timestamp: string;
  bookingId: string;
  action: 'create' | 'update' | 'cancel' | 'view' | 'search' | 'otp_request' | 'otp_verify';
  email: string;
  ipAddress: string;
  userAgent: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  status: 'success' | 'failure' | 'blocked';
  errorMessage?: string;
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const AUDIT_LOG_DB_ID = process.env.NOTION_AUDIT_LOGS_DATABASE_ID;

/**
 * Log an audit event to Notion database
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  // Log to console immediately
  const logLevel = entry.status === 'failure' || entry.status === 'blocked' ? 'warn' : 'info';
  console[logLevel](`[AUDIT] ${entry.action.toUpperCase()} by ${entry.email} from ${entry.ipAddress} - ${entry.status}`);
  
  // If Notion audit logs database is not configured, only log to console
  if (!AUDIT_LOG_DB_ID) {
    console.warn('[AUDIT] Notion audit logs database not configured. Logging to console only.');
    console.log('[AUDIT] Entry:', JSON.stringify(entry, null, 2));
    return;
  }

  try {
    await notion.pages.create({
      parent: { database_id: AUDIT_LOG_DB_ID },
      properties: {
        // Timestamp (Created time - automatically set by Notion)
        'Timestamp': {
          date: {
            start: entry.timestamp,
          },
        },
        // Booking ID
        'Booking ID': {
          rich_text: [
            {
              text: {
                content: entry.bookingId || 'N/A',
              },
            },
          ],
        },
        // Action
        'Action': {
          select: {
            name: entry.action,
          },
        },
        // Email
        'Email': {
          email: entry.email,
        },
        // IP Address
        'IP Address': {
          rich_text: [
            {
              text: {
                content: entry.ipAddress,
              },
            },
          ],
        },
        // User Agent
        'User Agent': {
          rich_text: [
            {
              text: {
                content: entry.userAgent.substring(0, 2000), // Notion limit
              },
            },
          ],
        },
        // Changes (JSON)
        'Changes': {
          rich_text: [
            {
              text: {
                content: entry.changes ? JSON.stringify(entry.changes).substring(0, 2000) : 'N/A',
              },
            },
          ],
        },
        // Metadata (JSON)
        'Metadata': {
          rich_text: [
            {
              text: {
                content: entry.metadata ? JSON.stringify(entry.metadata).substring(0, 2000) : 'N/A',
              },
            },
          ],
        },
        // Status
        'Status': {
          select: {
            name: entry.status,
          },
        },
        // Error Message (optional)
        ...(entry.errorMessage && {
          'Error Message': {
            rich_text: [
              {
                text: {
                  content: entry.errorMessage.substring(0, 2000),
                },
              },
            ],
          },
        }),
      },
    });
    
    console.log('[AUDIT] Logged to Notion successfully');
  } catch (error) {
    console.error('[AUDIT] Failed to log to Notion:', error);
    // Don't throw - audit logging should not break main functionality
    // Log the entry to console as fallback
    console.log('[AUDIT] Fallback - Entry:', JSON.stringify(entry, null, 2));
  }
}

/**
 * Helper to extract IP address from request
 */
export function getClientIP(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0] ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  );
}

/**
 * Helper to extract user agent from request
 */
export function getClientUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

/**
 * Create audit log entry for booking creation
 */
export function createBookingAudit(
  request: Request,
  bookingId: string,
  email: string,
  bookingData: any,
  status: 'success' | 'failure',
  errorMessage?: string
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    bookingId,
    action: 'create',
    email,
    ipAddress: getClientIP(request),
    userAgent: getClientUserAgent(request),
    changes: {
      service: bookingData.service,
      date: bookingData.date,
      time: bookingData.time,
      location: bookingData.location,
    },
    metadata: {
      firstName: bookingData.firstName,
      lastName: bookingData.lastName,
      phone: bookingData.phone,
    },
    status,
    errorMessage,
  };
}

/**
 * Create audit log entry for booking update
 */
export function createUpdateAudit(
  request: Request,
  bookingId: string,
  email: string,
  oldData: any,
  newData: any,
  status: 'success' | 'failure',
  errorMessage?: string
): AuditLogEntry {
  const changes: Record<string, any> = {};
  
  // Track what changed
  if (oldData.date !== newData.date) {
    changes.date = { from: oldData.date, to: newData.date };
  }
  if (oldData.time !== newData.time) {
    changes.time = { from: oldData.time, to: newData.time };
  }
  
  return {
    timestamp: new Date().toISOString(),
    bookingId,
    action: 'update',
    email,
    ipAddress: getClientIP(request),
    userAgent: getClientUserAgent(request),
    changes,
    status,
    errorMessage,
  };
}

/**
 * Create audit log entry for booking cancellation
 */
export function createCancelAudit(
  request: Request,
  bookingId: string,
  email: string,
  status: 'success' | 'failure',
  errorMessage?: string
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    bookingId,
    action: 'cancel',
    email,
    ipAddress: getClientIP(request),
    userAgent: getClientUserAgent(request),
    status,
    errorMessage,
  };
}

/**
 * Create audit log entry for booking view
 */
export function createViewAudit(
  request: Request,
  bookingId: string,
  email: string,
  status: 'success' | 'failure',
  errorMessage?: string
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    bookingId,
    action: 'view',
    email,
    ipAddress: getClientIP(request),
    userAgent: getClientUserAgent(request),
    status,
    errorMessage,
  };
}

/**
 * Create audit log entry for booking search
 */
export function createSearchAudit(
  request: Request,
  email: string,
  resultsCount: number,
  status: 'success' | 'failure',
  errorMessage?: string
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    bookingId: 'N/A',
    action: 'search',
    email,
    ipAddress: getClientIP(request),
    userAgent: getClientUserAgent(request),
    metadata: {
      resultsCount,
    },
    status,
    errorMessage,
  };
}

/**
 * Create audit log entry for OTP request
 */
export function createOTPRequestAudit(
  request: Request,
  bookingId: string,
  email: string,
  status: 'success' | 'failure' | 'blocked',
  errorMessage?: string
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    bookingId,
    action: 'otp_request',
    email,
    ipAddress: getClientIP(request),
    userAgent: getClientUserAgent(request),
    status,
    errorMessage,
  };
}

/**
 * Create audit log entry for OTP verification
 */
export function createOTPVerifyAudit(
  request: Request,
  bookingId: string,
  email: string,
  attemptsRemaining: number,
  status: 'success' | 'failure',
  errorMessage?: string
): AuditLogEntry {
  return {
    timestamp: new Date().toISOString(),
    bookingId,
    action: 'otp_verify',
    email,
    ipAddress: getClientIP(request),
    userAgent: getClientUserAgent(request),
    metadata: {
      attemptsRemaining,
    },
    status,
    errorMessage,
  };
}
