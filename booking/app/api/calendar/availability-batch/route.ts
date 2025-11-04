import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const STUDIO_TZ = 'Asia/Manila';
const SHOP_HOURS = { open: 8, close: 20 };
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

function generateDailySlots() {
  const start = SHOP_HOURS.open * 60;
  const end = SHOP_HOURS.close * 60;
  const slots: string[] = [];
  for (let mins = start; mins <= end - SLOT_MINUTES; mins += SLOT_MINUTES) {
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

    console.log(`Fetching events from ${dates[0]} to ${dates[dates.length - 1]}`);

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`Found ${events.length} events in date range`);

    // Group events by date
    const eventsByDate: Record<string, typeof events> = {};
    events.forEach(event => {
      if (!event.start?.dateTime) return;
      const eventDate = event.start.dateTime.split('T')[0];
      if (!eventsByDate[eventDate]) eventsByDate[eventDate] = [];
      eventsByDate[eventDate].push(event);
    });

    // Calculate availability for each date
    const results = dates.map(date => {
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

    console.log(`Processed ${results.length} dates successfully`);

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