import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const STUDIO_TZ = 'Asia/Manila';
const SHOP_HOURS = { open: 10, close: 16 }; // Default shop hours

// Add this type definition:
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
const SLOT_MINUTES = 15;
const BUFFER_MINUTES = 30;

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

function generateDailySlots(dateStr?: string, duration: number = 45, buffer: number = BUFFER_MINUTES) {
  const hours: ShopHours = dateStr ? getShopHoursForDate(dateStr) : { ...SHOP_HOURS, lunchBreak: null };
  const start = hours.open * 60;
  const end = hours.close * 60;
  
  // Calculate the latest possible start time
  const latestStartTime = end - duration - buffer;
  
  const slots: string[] = [];
  
  for (let mins = start; mins <= latestStartTime; mins += SLOT_MINUTES) {
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

function isSlotAvailable(
  slotHHMM: string,
  duration: number,
  blockedRanges: [number, number][]
): boolean {
  const slotStart = toMinutes(slotHHMM);
  const slotEnd = slotStart + duration;
  
  return blockedRanges.every(([blockStart, blockEnd]) => {
    return slotEnd <= blockStart || slotStart >= blockEnd;
  });
}

function calculateRealSlots(availableSlots: string[], duration: number): number {
  let totalAvailableMinutes = 0;
  let lastSlotEnd = -1;
  
  availableSlots.forEach(slot => {
    const slotStart = toMinutes(slot);
    if (slotStart === lastSlotEnd || lastSlotEnd === -1) {
      totalAvailableMinutes += SLOT_MINUTES;
      lastSlotEnd = slotStart + SLOT_MINUTES;
    } else {
      lastSlotEnd = slotStart + SLOT_MINUTES;
      totalAvailableMinutes += SLOT_MINUTES;
    }
  });
  
  const sessionsWithBuffer = Math.floor(totalAvailableMinutes / (duration + BUFFER_MINUTES));
  return Math.max(0, sessionsWithBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const { dates, duration = 45 } = await request.json();

    if (!dates || !Array.isArray(dates)) {
      return NextResponse.json(
        { error: 'Dates array is required' },
        { status: 400 }
      );
    }

    console.log('Batch API received dates:', dates.slice(0, 5), '... total:', dates.length);

    // If no refresh token, return mock data for all dates
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      console.warn('Google Calendar not configured. Using mock data for batch request.');
      const allSlots = generateDailySlots();
      const realSlots = calculateRealSlots(allSlots, duration);
      const results = dates.map(date => ({
        date,
        count: realSlots
      }));
      
      return NextResponse.json({
        success: true,
        results,
        usingMockData: true,
      });
    }

    // Initialize OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/calendar/callback`
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch events for entire date range (ONE API call instead of 30!)
    const startDate = new Date(dates[0] + 'T00:00:00+08:00');
    const endDate = new Date(dates[dates.length - 1] + 'T23:59:59+08:00');

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500, // Increase limit for busy calendars
    });

    const events = response.data.items || [];

    // Group events by date (including all-day events)
    const eventsByDate: Record<string, typeof events> = {};
    const blockedDates = new Set<string>(); // Track fully blocked dates
    
    events.forEach(event => {
      // Check for all-day blocked events (can span multiple days)
      if (event.start?.date) {
        const isBlocked = event.summary?.includes('[BLOCKED]') || event.summary?.includes('[Studio Blocked]') || event.summary?.includes('🚫');
        if (isBlocked) {
          const startDate = new Date(event.start.date);
          const endDate = event.end?.date ? new Date(event.end.date) : new Date(event.start.date);
          
          // For multi-day events, Google Calendar end date is exclusive, so we subtract 1 day
          const actualEndDate = new Date(endDate);
          actualEndDate.setDate(actualEndDate.getDate() - 1);
          
          // Add all dates in the range
          const currentDate = new Date(startDate);
          while (currentDate <= actualEndDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            blockedDates.add(dateStr);
            console.log(`[Batch] Date ${dateStr} is blocked (from ${event.start.date} to ${event.end?.date}): ${event.summary}`);
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
        return;
      }
      
      // Regular timed events
      if (!event.start?.dateTime) return;
      const eventDate = event.start.dateTime.split('T')[0];
      if (!eventsByDate[eventDate]) eventsByDate[eventDate] = [];
      eventsByDate[eventDate].push(event);
    });

    // Calculate availability for each date
    const results = dates.map(date => {
      // Check if date is fully blocked
      if (blockedDates.has(date)) {
        return { date, count: 0 };
      }
      
      const dayEvents = eventsByDate[date] || [];
      const blockedRanges: [number, number][] = [];

      dayEvents.forEach((event) => {
        if (!event.start?.dateTime || !event.end?.dateTime) return;

        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        const startMins = eventStart.getHours() * 60 + eventStart.getMinutes() - BUFFER_MINUTES;
        const endMins = eventEnd.getHours() * 60 + eventEnd.getMinutes() + BUFFER_MINUTES;

        const clampedStart = Math.max(startMins, SHOP_HOURS.open * 60);
        const clampedEnd = Math.min(endMins, SHOP_HOURS.close * 60);

        blockedRanges.push([clampedStart, clampedEnd]);
      });

      const allSlots = generateDailySlots();
      const availableSlots = allSlots.filter((slot) =>
        isSlotAvailable(slot, duration, blockedRanges)
      );
      
      const realSlots = calculateRealSlots(availableSlots, duration);

      return {
        date,
        count: realSlots
      };
    });

    return NextResponse.json({
      success: true,
      results,
      usingMockData: false,
    });

  } catch (error) {
    console.error('Batch Calendar API Error:', error);
    
    // Fallback to mock data on error
    try {
      const body = await request.json();
      const { dates, duration = 45 } = body;
      const allSlots = generateDailySlots();
      const realSlots = calculateRealSlots(allSlots, duration);
      const results = dates.map((date: string) => ({ date, count: realSlots }));
      
      return NextResponse.json({
        success: true,
        results,
        usingMockData: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  }
}