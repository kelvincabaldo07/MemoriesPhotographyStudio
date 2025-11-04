import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const STUDIO_TZ = 'Asia/Manila';
const SHOP_HOURS = { open: 8, close: 20 }; // 8 AM - 8 PM
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '45');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Check if refresh token exists
    if (!process.env.GOOGLE_REFRESH_TOKEN) {
      console.warn('Google Calendar not configured. Using mock data.');
      const allSlots = generateDailySlots();
      const realSlots = calculateRealSlots(allSlots, duration);
      
      return NextResponse.json({
        success: true,
        date,
        duration,
        availableSlots: allSlots,
        totalSlots: allSlots.length,
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

    // Build blocked ranges
    const blockedRanges: [number, number][] = [];

    events.forEach((event) => {
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

    return NextResponse.json({
      success: true,
      date,
      duration,
      availableSlots,
      totalSlots: allSlots.length,
      realBookableSlots: realSlots, // Actual sessions that can be booked
      bookedEvents: events.length,
      usingMockData: false,
    });

  } catch (error) {
    console.error('Calendar API Error:', error);
    
    const allSlots = generateDailySlots();
    const realSlots = calculateRealSlots(allSlots, parseInt(request.nextUrl.searchParams.get('duration') || '45'));
    
    return NextResponse.json({
      success: true,
      date: request.nextUrl.searchParams.get('date'),
      duration: parseInt(request.nextUrl.searchParams.get('duration') || '45'),
      availableSlots: allSlots,
      totalSlots: allSlots.length,
      realBookableSlots: realSlots,
      bookedEvents: 0,
      usingMockData: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}