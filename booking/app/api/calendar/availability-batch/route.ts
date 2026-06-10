import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { loadSchedule, getDayHours, hhmmToMinutes, DEFAULT_SCHEDULE, type WeekSchedule } from '@/lib/schedule-store';

const STUDIO_TZ = 'Asia/Manila';
const SLOT_MINUTES = 15;
const BUFFER_MINUTES = 30;

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function toHHMM(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
}

// Alias kept for internal use
const toMinutes = hhmmToMinutes;

/**
 * Generate available time slots for a given date using the admin-configured schedule.
 * Respects the day's open/close hours and all configured break periods.
 */
function generateDailySlots(
  dateStr: string,
  schedule: WeekSchedule,
  duration: number = 45,
  buffer: number = BUFFER_MINUTES
): string[] {
  const dayHours = getDayHours(dateStr, schedule);
  if (!dayHours) return []; // Day is disabled

  const start = hhmmToMinutes(dayHours.open);
  const end = hhmmToMinutes(dayHours.close);
  const latestStartTime = end - duration - buffer;

  const slots: string[] = [];
  for (let mins = start; mins <= latestStartTime; mins += SLOT_MINUTES) {
    slots.push(toHHMM(mins));
  }

  // Filter out any break periods
  return slots.filter(slot => {
    const slotMinutes = hhmmToMinutes(slot);
    const slotEnd = slotMinutes + duration + buffer;
    return dayHours.breaks.every(b => {
      const breakStart = hhmmToMinutes(b.start);
      const breakEnd = hhmmToMinutes(b.end);
      return slotEnd <= breakStart || slotMinutes >= breakEnd;
    });
  });
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
  // Load the admin-configured schedule once for the entire batch
  let schedule: WeekSchedule = DEFAULT_SCHEDULE;
  try {
    schedule = await loadSchedule();
  } catch (err) {
    console.warn('Failed to load schedule for batch, using defaults');
  }

  try {
    const { dates, duration = 45, adminBypass = false } = await request.json();

    if (!dates || !Array.isArray(dates)) {
      return NextResponse.json(
        { error: 'Dates array is required' },
        { status: 400 }
      );
    }

    console.log('Batch API received dates:', dates.slice(0, 5), '... total:', dates.length);
    
    // If admin bypass is enabled, return maximum slots for all dates
    if (adminBypass) {
      const results = dates.map((date: string) => ({
        date,
        count: generateDailySlots(date, schedule, duration, BUFFER_MINUTES).length,
      }));
      
      return NextResponse.json({
        success: true,
        results,
        adminBypass: true,
      });
    }

    // If no refresh token, return mock data for all dates
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      console.warn('Google Calendar not configured. Using mock data for batch request.');
      const results = dates.map((date: string) => {
        const allSlots = generateDailySlots(date, schedule, duration, BUFFER_MINUTES);
        return { date, count: calculateRealSlots(allSlots, duration) };
      });
      
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
    const results = dates.map((date: string) => {
      // Check if date is fully blocked
      if (blockedDates.has(date)) {
        return { date, count: 0 };
      }
      
      const dayEvents = eventsByDate[date] || [];
      const blockedRanges: [number, number][] = [];
      const dayHours = getDayHours(date, schedule); // Get correct hours for this specific date
      const dayOpen = dayHours ? hhmmToMinutes(dayHours.open) : 0;
      const dayClose = dayHours ? hhmmToMinutes(dayHours.close) : 24 * 60;

      dayEvents.forEach((event) => {
        if (!event.start?.dateTime || !event.end?.dateTime) return;

        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        const startMins = eventStart.getHours() * 60 + eventStart.getMinutes();
        const endMins = eventEnd.getHours() * 60 + eventEnd.getMinutes();

        const clampedStart = Math.max(startMins, dayOpen);
        const clampedEnd = Math.min(endMins, dayClose);

        blockedRanges.push([clampedStart, clampedEnd]);
      });

      const allSlots = generateDailySlots(date, schedule, duration, BUFFER_MINUTES);
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
      const results = dates.map((date: string) => {
        const allSlots = generateDailySlots(date, schedule, duration, BUFFER_MINUTES);
        return { date, count: calculateRealSlots(allSlots, duration) };
      });
      
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