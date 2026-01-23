import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const STUDIO_TZ = 'Asia/Manila';

// Add type definition:
type ShopHours = {
  open: number;
  close: number;
  lunchBreak?: { start: number; end: number } | null;
};

const SHOP_HOURS_BY_DAY: Record<number, ShopHours> = {
  0: { open: 13, close: 18, lunchBreak: null },
  1: { open: 10, close: 16, lunchBreak: { start: 12, end: 13 } },
  2: { open: 10, close: 16, lunchBreak: { start: 12, end: 13 } },
  3: { open: 10, close: 16, lunchBreak: { start: 12, end: 13 } },
  4: { open: 10, close: 16, lunchBreak: { start: 12, end: 13 } },
  5: { open: 10, close: 16, lunchBreak: { start: 12, end: 13 } },
  6: { open: 10, close: 18, lunchBreak: { start: 12, end: 13 } },
};
const SHOP_HOURS = { open: 10, close: 16 };
const SLOT_MINUTES = 15;
const BUFFER_MINUTES = 30;
const MIN_SESSION_DURATION = 45; // Minimum booking duration

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}

function getShopHoursForDate(dateStr: string): ShopHours {
  const date = new Date(dateStr + 'T12:00:00');
  const dayOfWeek = date.getDay();
  return SHOP_HOURS_BY_DAY[dayOfWeek];
}

function generateDailySlots(dateStr?: string, duration: number = MIN_SESSION_DURATION, buffer: number = BUFFER_MINUTES, slotSize: number = SLOT_MINUTES) {
  const hours: ShopHours = dateStr ? getShopHoursForDate(dateStr) : { ...SHOP_HOURS, lunchBreak: null };
  const start = hours.open * 60;
  const end = hours.close * 60;
  
  // Calculate the latest possible start time
  const latestStartTime = end - duration - buffer;
  
  const slots: string[] = [];
  
  for (let mins = start; mins <= latestStartTime; mins += slotSize) {
    slots.push(toHHMM(mins));
  }
  
  // Filter out lunch break if applicable
  if (hours.lunchBreak) {
    const lunchStart = hours.lunchBreak.start * 60;
    const lunchEnd = hours.lunchBreak.end * 60;
    
    return slots.filter(slot => {
      const slotMinutes = toMinutes(slot);
      const slotEnd = slotMinutes + duration + buffer;
      
      return slotEnd <= lunchStart || slotMinutes >= lunchEnd;
    });
  }
  
  return slots;
}

// Generate 24-hour slots for admin bypass mode (00:00 to 23:45)
function generateFullDaySlots(slotSize: number = SLOT_MINUTES): string[] {
  const slots: string[] = [];
  // Generate slots from 00:00 to 23:45 (or whatever fits in 24 hours)
  const totalMinutesInDay = 24 * 60;
  
  for (let mins = 0; mins < totalMinutesInDay; mins += slotSize) {
    slots.push(toHHMM(mins));
  }
  
  return slots;
}

function isSlotAvailable(
  slotHHMM: string,
  duration: number,
  blockedRanges: [number, number][]
): boolean {
  const slotStart = toMinutes(slotHHMM);
  // Include the 30-minute buffer in the slot duration check
  // When a customer books this slot, it will occupy: start -> start + duration + buffer
  const slotEnd = slotStart + duration + BUFFER_MINUTES;
  
  // Check if this slot overlaps with any blocked range
  // A slot is only available if it doesn't overlap with ANY booking
  return blockedRanges.every(([blockStart, blockEnd]) => {
    // No overlap if: slot ends before or exactly when block starts, OR slot starts after block ends
    // Note: We need buffer, so slot ending exactly when block starts is NOT ok
    return slotEnd <= blockStart || slotStart >= blockEnd;
  });
}

// Calculate actual bookable slots (not just 15-min increments)
function calculateRealSlots(availableSlots: string[], duration: number): number {
  // Total available minutes
  let totalAvailableMinutes = 0;
  let lastSlotEnd = -1;
  
  availableSlots.forEach(slot => {
    const slotStart = toMinutes(slot);
    if (slotStart === lastSlotEnd || lastSlotEnd === -1) {
      // Continuous or first slot
      totalAvailableMinutes += SLOT_MINUTES;
      lastSlotEnd = slotStart + SLOT_MINUTES;
    } else {
      // Gap detected, calculate previous chunk
      lastSlotEnd = slotStart + SLOT_MINUTES;
      totalAvailableMinutes += SLOT_MINUTES;
    }
  });
  
  // Calculate how many sessions can fit
  const sessionsWithBuffer = Math.floor(totalAvailableMinutes / (duration + BUFFER_MINUTES));
  return Math.max(0, sessionsWithBuffer);
}

// Filter out past time slots if date is today
function filterPastSlots(slots: string[], dateStr: string, leadTimeMinutes: number = 120): string[] {
  const today = new Date().toLocaleDateString('en-US', { timeZone: STUDIO_TZ }).split('/');
  const todayStr = `${today[2]}-${today[0].padStart(2, '0')}-${today[1].padStart(2, '0')}`;
  
  if (dateStr !== todayStr) return slots;
  
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: STUDIO_TZ }));
  const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Add minimum advance booking time from settings
  const minBookingTime = currentTimeInMinutes + leadTimeMinutes;
  
  return slots.filter(slot => {
    const slotTimeInMinutes = toMinutes(slot);
    return slotTimeInMinutes >= minBookingTime;
  });
}

export async function GET(request: NextRequest) {
  // Check if admin bypass is enabled (allows admins to book beyond available slots)
  const { searchParams } = new URL(request.url);
  const adminBypass = searchParams.get('adminBypass') === 'true';
  
  // Fetch booking policies from settings (declare outside try for catch access)
  let bookingPolicies = {
    leadTime: 2,
    leadTimeUnit: 'hours' as 'minutes' | 'hours' | 'days',
    bookingSlotSize: 15,
    bookingSlotUnit: 'minutes' as 'minutes' | 'hours',
    schedulingWindow: 90,
    schedulingWindowUnit: 'days' as 'days' | 'months',
  };
  
  try {
    const settingsUrl = new URL('/api/booking-settings', request.url);
    const settingsRes = await fetch(settingsUrl.toString());
    if (settingsRes.ok) {
      const settings = await settingsRes.json();
      bookingPolicies = settings;
    }
  } catch (err) {
    console.warn('Failed to load booking settings, using defaults');
  }

  try {
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '45');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }
    
    // If admin bypass is enabled, return all 24-hour time slots without filtering
    if (adminBypass) {
      const allSlots = generateFullDaySlots(15); // Generate 00:00 to 23:45 in 15-min increments
      return NextResponse.json({
        success: true,
        date,
        duration,
        availableSlots: allSlots,
        totalSlots: allSlots.length,
        realBookableSlots: allSlots.length,
        bookedEvents: 0,
        adminBypass: true,
        message: 'Admin mode: All 24-hour time slots available (00:00-23:45)',
      });
    }

    // Convert lead time to minutes
    let leadTimeMinutes = bookingPolicies.leadTime;
    if (bookingPolicies.leadTimeUnit === 'hours') {
      leadTimeMinutes = bookingPolicies.leadTime * 60;
    } else if (bookingPolicies.leadTimeUnit === 'days') {
      leadTimeMinutes = bookingPolicies.leadTime * 24 * 60;
    }

    // Convert slot size to minutes
    let slotSizeMinutes = bookingPolicies.bookingSlotSize;
    if (bookingPolicies.bookingSlotUnit === 'hours') {
      slotSizeMinutes = bookingPolicies.bookingSlotSize * 60;
    }

    // Check if refresh token exists
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      console.warn('Google Calendar not configured. Using mock data.');
      const allSlots = generateDailySlots(date, duration, BUFFER_MINUTES, slotSizeMinutes);
      const filteredSlots = filterPastSlots(allSlots, date, leadTimeMinutes);
      const realSlots = calculateRealSlots(filteredSlots, duration);
      
      return NextResponse.json({
        success: true,
        date,
        duration,
        availableSlots: filteredSlots,
        totalSlots: filteredSlots.length,
        realBookableSlots: realSlots, // Actual sessions that can be booked
        bookedEvents: 0,
        usingMockData: true,
      });
    }

    // Initialize OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calendar/callback`
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Define time range
    const startOfDay = new Date(`${date}T00:00:00+08:00`);
    const endOfDay = new Date(`${date}T23:59:59+08:00`);

    // Fetch events
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];

    console.log(`[Availability] Found ${events.length} events for ${date}`);

    // Check for all-day blocked events (studio closed)
    const hasAllDayBlock = events.some(event => {
      const isAllDay = !!event.start?.date; // All-day events use 'date' not 'dateTime'
      const isBlocked = event.summary?.includes('[BLOCKED]') || event.summary?.includes('[Studio Blocked]') || event.summary?.includes('🚫');
      if (isAllDay && isBlocked) {
        console.log(`[Availability] All-day block found: ${event.summary}`);
        return true;
      }
      return false;
    });

    // If entire day is blocked, return no slots
    if (hasAllDayBlock) {
      console.log(`[Availability] Date ${date} is completely blocked`);
      return NextResponse.json({
        success: true,
        date,
        duration,
        availableSlots: [],
        totalSlots: 0,
        realBookableSlots: 0,
        bookedEvents: events.length,
        usingMockData: false,
        blocked: true,
      });
    }

    // Build blocked ranges
    const blockedRanges: [number, number][] = [];
    const dayShopHours = getShopHoursForDate(date); // Get correct hours for this specific date

    events.forEach((event) => {
      if (!event.start?.dateTime || !event.end?.dateTime) return;

      // Convert to Manila timezone
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      
      // Get Manila time hours and minutes
      const manilaStartStr = eventStart.toLocaleString('en-US', { 
        timeZone: STUDIO_TZ, 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      const manilaEndStr = eventEnd.toLocaleString('en-US', { 
        timeZone: STUDIO_TZ, 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      const [startHour, startMin] = manilaStartStr.split(':').map(Number);
      const [endHour, endMin] = manilaEndStr.split(':').map(Number);

      // Calendar events already include the buffer in their duration
      const startMins = startHour * 60 + startMin;
      const endMins = endHour * 60 + endMin;

      // Use the correct shop hours for this date
      const clampedStart = Math.max(startMins, dayShopHours.open * 60);
      const clampedEnd = Math.min(endMins, dayShopHours.close * 60);

      console.log(`[Availability ${date}] Event: "${event.summary}"`);
      console.log(`  - Start: ${event.start.dateTime} → Manila: ${manilaStartStr} (${clampedStart} mins)`);
      console.log(`  - End: ${event.end.dateTime} → Manila: ${manilaEndStr} (${clampedEnd} mins)`);
      console.log(`  - Blocking range: ${toHHMM(clampedStart)} - ${toHHMM(clampedEnd)}`);

      blockedRanges.push([clampedStart, clampedEnd]);
    });
    
    console.log(`[Availability ${date}] Total blocked ranges: ${blockedRanges.length}`);

    const allSlots = generateDailySlots(date, duration, BUFFER_MINUTES, slotSizeMinutes);
    console.log(`[Availability ${date}] Generated ${allSlots.length} total slots for ${duration}min duration`);
    
    // If admin bypass, return all slots but also mark which ones are booked
    if (adminBypass) {
      const unavailableSlots = allSlots.filter((slot) =>
        !isSlotAvailable(slot, duration, blockedRanges)
      );
      console.log(`[Availability ${date}] Admin bypass: ${unavailableSlots.length} slots are booked`);
      
      return NextResponse.json({
        success: true,
        date,
        duration,
        availableSlots: allSlots, // All slots in admin mode
        unavailableSlots, // Which ones are actually booked
        totalSlots: allSlots.length,
        realBookableSlots: allSlots.length,
        bookedEvents: events.length,
        adminBypass: true,
        usingMockData: false,
      });
    }
    
    // Regular mode: filter out booked slots
    const availableSlots = allSlots.filter((slot) => {
      const isAvailable = isSlotAvailable(slot, duration, blockedRanges);
      if (!isAvailable) {
        console.log(`[Availability ${date}] Slot ${slot} blocked (needs ${duration}+${BUFFER_MINUTES} mins)`);
      }
      return isAvailable;
    });
    const filteredSlots = filterPastSlots(availableSlots, date, leadTimeMinutes);
    console.log(`[Availability ${date}] ${availableSlots.length} available → ${filteredSlots.length} after filtering past times`);
    
    const realSlots = calculateRealSlots(filteredSlots, duration);

    return NextResponse.json({
      success: true,
      date,
      duration,
      availableSlots: filteredSlots,
      totalSlots: allSlots.length,
      realBookableSlots: realSlots, // Actual sessions that can be booked
      bookedEvents: events.length,
      usingMockData: false,
    });

  } catch (error) {
    console.error('Calendar API Error:', error);
    
    const dateParam = request.nextUrl.searchParams.get('date') || '';
    const durationParam = parseInt(request.nextUrl.searchParams.get('duration') || '45');
    
    // Use settings that were loaded earlier (or defaults if load failed)
    // Convert lead time to minutes
    let leadTimeMinutes = bookingPolicies.leadTime;
    if (bookingPolicies.leadTimeUnit === 'hours') {
      leadTimeMinutes = bookingPolicies.leadTime * 60;
    } else if (bookingPolicies.leadTimeUnit === 'days') {
      leadTimeMinutes = bookingPolicies.leadTime * 24 * 60;
    }

    // Convert slot size to minutes
    let slotSizeMinutes = bookingPolicies.bookingSlotSize;
    if (bookingPolicies.bookingSlotUnit === 'hours') {
      slotSizeMinutes = bookingPolicies.bookingSlotSize * 60;
    }
    
    const allSlots = generateDailySlots(dateParam, durationParam, BUFFER_MINUTES, slotSizeMinutes);
    const filteredSlots = filterPastSlots(allSlots, dateParam, leadTimeMinutes);
    const realSlots = calculateRealSlots(filteredSlots, durationParam);
    
    return NextResponse.json({
      success: true,
      date: request.nextUrl.searchParams.get('date'),
      duration: parseInt(request.nextUrl.searchParams.get('duration') || '45'),
      availableSlots: filteredSlots,
      totalSlots: filteredSlots.length,
      realBookableSlots: realSlots,
      bookedEvents: 0,
      usingMockData: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}