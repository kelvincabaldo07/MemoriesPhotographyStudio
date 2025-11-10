/**
 * Time utilities for consistent Asia/Manila timezone handling
 */

/**
 * Get current time in Asia/Manila timezone
 */
export function getManilaTime(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
}

/**
 * Convert 24-hour time string (HH:mm) to 12-hour format with AM/PM
 * @param time24 - Time in 24-hour format (e.g., "14:30")
 * @returns Time in 12-hour format with AM/PM (e.g., "2:30 PM")
 */
export function formatTimeTo12Hour(time24: string): string {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Convert 12-hour time string with AM/PM to 24-hour format (HH:mm)
 * @param time12 - Time in 12-hour format (e.g., "2:30 PM")
 * @returns Time in 24-hour format (e.g., "14:30")
 */
export function formatTimeTo24Hour(time12: string): string {
  if (!time12) return '';
  
  const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return time12; // Return as-is if not in expected format
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Format date string to display in Asia/Manila timezone
 * @param dateStr - Date string (YYYY-MM-DD)
 * @param options - Intl.DateTimeFormatOptions
 */
export function formatManilaDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    ...options,
    timeZone: 'Asia/Manila'
  });
}

/**
 * Get today's date in Asia/Manila timezone in YYYY-MM-DD format
 */
export function getTodayInManila(): string {
  const manilaTime = getManilaTime();
  const year = manilaTime.getFullYear();
  const month = (manilaTime.getMonth() + 1).toString().padStart(2, '0');
  const day = manilaTime.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in Manila in HH:mm format
 */
export function getCurrentManilaTime(): string {
  const manilaTime = getManilaTime();
  const hours = manilaTime.getHours().toString().padStart(2, '0');
  const minutes = manilaTime.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Create ISO 8601 datetime string for Manila timezone
 * For use in calendar events and email notifications
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:mm format
 * @returns ISO 8601 datetime string (e.g., "2025-11-10T14:30:00+08:00")
 */
export function createManilaDateTime(dateStr: string, timeStr: string): string {
  // Manila is UTC+8
  return `${dateStr}T${timeStr}:00+08:00`;
}

/**
 * Format date and time for display
 * @param dateStr - Date string (YYYY-MM-DD)
 * @param timeStr - Time string in 24-hour format (HH:mm)
 * @returns Formatted string like "Nov 10, 2025 at 2:30 PM"
 */
export function formatManilaDateTime(dateStr: string, timeStr: string): string {
  const dateFormatted = formatManilaDate(dateStr, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const timeFormatted = formatTimeTo12Hour(timeStr);
  return `${dateFormatted} at ${timeFormatted}`;
}
