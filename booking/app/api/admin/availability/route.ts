/**
 * Availability API
 * Handles syncing working hours, breaks, and blocked dates to Google Calendar and Notion
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

interface ShopHours {
  open: string;
  close: string;
  breaks: TimeSlot[];
  enabled: boolean;
}

interface BlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

type WeekSchedule = {
  [key: string]: ShopHours;
};

interface AvailabilityData {
  schedule: WeekSchedule;
  blockedDates: BlockedDate[];
  timezone: string;
}

function getOAuth2Client() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/calendar/callback` : 'http://localhost:3000/api/calendar/callback'
  );

  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (refreshToken) {
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
  }

  return oauth2Client;
}

/**
 * GET: Fetch current availability settings
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Fetch from database or config file
    // For now, return default settings
    const defaultAvailability: AvailabilityData = {
      schedule: {
        Monday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
        Tuesday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
        Wednesday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
        Thursday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
        Friday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
        Saturday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
        Sunday: { open: "13:00", close: "20:00", breaks: [], enabled: true },
      },
      blockedDates: [],
      timezone: 'Asia/Manila',
    };

    return NextResponse.json(defaultAvailability);
  } catch (error) {
    console.error('[Availability API] Error fetching availability:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

/**
 * POST: Save availability and sync to Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    const data: AvailabilityData = await request.json();
    const { schedule, blockedDates, timezone } = data;

    console.log('[Availability API] Syncing availability to Google Calendar...');

    // Sync blocked dates to Google Calendar
    const syncResults = {
      blockedDatesCreated: 0,
      blockedDatesUpdated: 0,
      blockedDatesDeleted: 0,
      breaksCreated: 0,
      errors: [] as string[],
    };

    // Get OAuth client
    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Fetch existing events tagged with our markers
    const now = new Date();
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2); // Look ahead 2 years

    const existingEvents = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      q: '[Studio Blocked]', // Search for our marker
      singleEvents: true,
    });

    const existingBlockedEvents = existingEvents.data.items || [];
    const existingEventIds = new Set(existingBlockedEvents.map(e => e.id));

    // Create/Update blocked dates in Google Calendar
    for (const blocked of blockedDates) {
      try {
        // Check if event already exists (by checking description)
        const existingEvent = existingBlockedEvents.find(e => 
          e.description?.includes(`Block ID: ${blocked.id}`)
        );

        const eventData: any = {
          summary: `🚫 [Studio Blocked] ${blocked.reason || 'Unavailable'}`,
          description: `Block ID: ${blocked.id}\n${blocked.reason || 'Studio is not available during this time'}`,
          colorId: '11', // Red color for blocked dates
          transparency: 'transparent', // Show as "Free" so it doesn't block personal events
          visibility: 'public',
        };

        if (blocked.allDay) {
          // All-day event
          const startDate = new Date(blocked.startDate);
          const endDate = new Date(blocked.endDate);
          endDate.setDate(endDate.getDate() + 1); // End date is exclusive for all-day events

          eventData.start = { date: blocked.startDate };
          eventData.end = { date: endDate.toISOString().split('T')[0] };
        } else {
          // Timed event
          eventData.start = {
            dateTime: `${blocked.startDate}T${blocked.startTime}:00`,
            timeZone: timezone,
          };
          eventData.end = {
            dateTime: `${blocked.endDate}T${blocked.endTime}:00`,
            timeZone: timezone,
          };
        }

        if (existingEvent) {
          // Update existing event
          await calendar.events.patch({
            calendarId: CALENDAR_ID,
            eventId: existingEvent.id!,
            requestBody: eventData,
          });
          syncResults.blockedDatesUpdated++;
          existingEventIds.delete(existingEvent.id);
          console.log(`[Availability API] ✅ Updated blocked date: ${blocked.id}`);
        } else {
          // Create new event
          const response = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: eventData,
          });
          syncResults.blockedDatesCreated++;
          console.log(`[Availability API] ✅ Created blocked date: ${response.data.id}`);
        }
      } catch (error) {
        console.error(`[Availability API] Error syncing blocked date ${blocked.id}:`, error);
        syncResults.errors.push(`Failed to sync blocked date ${blocked.id}`);
      }
    }

    // Delete events that no longer exist in our blocked dates
    for (const eventId of existingEventIds) {
      try {
        await calendar.events.delete({
          calendarId: CALENDAR_ID,
          eventId: eventId as string,
        });
        syncResults.blockedDatesDeleted++;
        console.log(`[Availability API] ✅ Deleted removed blocked date: ${eventId}`);
      } catch (error) {
        console.error(`[Availability API] Error deleting event ${eventId}:`, error);
      }
    }

    // Create recurring break events for the next 3 months
    // This helps show breaks in calendar but doesn't block time
    const breakSyncDate = new Date();
    const breakEndDate = new Date();
    breakEndDate.setMonth(breakEndDate.getMonth() + 3);

    // Fetch existing break events
    const existingBreaks = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: breakSyncDate.toISOString(),
      timeMax: breakEndDate.toISOString(),
      q: '[Break]',
      singleEvents: true,
    });

    const existingBreakEvents = existingBreaks.data.items || [];

    // Create break events for each day with breaks
    for (const [day, hours] of Object.entries(schedule)) {
      if (!hours.enabled || hours.breaks.length === 0) continue;

      for (const breakSlot of hours.breaks) {
        try {
          const dayNumber = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(day);
          
          // Find next occurrence of this day
          let currentDate = new Date(breakSyncDate);
          while (currentDate.getDay() !== dayNumber) {
            currentDate.setDate(currentDate.getDate() + 1);
          }

          // Create recurring weekly event
          const rrule = `FREQ=WEEKLY;UNTIL=${breakEndDate.toISOString().split('T')[0].replace(/-/g, '')}`;
          
          const breakEvent = {
            summary: `☕ [Break] Lunch Break`,
            description: `Break ID: ${day}-${breakSlot.id}\nStudio break time - not available for bookings`,
            start: {
              dateTime: `${currentDate.toISOString().split('T')[0]}T${breakSlot.start}:00`,
              timeZone: timezone,
            },
            end: {
              dateTime: `${currentDate.toISOString().split('T')[0]}T${breakSlot.end}:00`,
              timeZone: timezone,
            },
            recurrence: [rrule],
            colorId: '5', // Yellow/orange for breaks
            transparency: 'opaque', // Show as "Busy"
            visibility: 'public',
          };

          // Check if this break already exists
          const existingBreak = existingBreakEvents.find(e =>
            e.description?.includes(`Break ID: ${day}-${breakSlot.id}`)
          );

          if (!existingBreak) {
            await calendar.events.insert({
              calendarId: CALENDAR_ID,
              requestBody: breakEvent,
            });
            syncResults.breaksCreated++;
            console.log(`[Availability API] ✅ Created break event for ${day}`);
          }
        } catch (error) {
          console.error(`[Availability API] Error creating break for ${day}:`, error);
        }
      }
    }

    // TODO: Save to database/config file
    console.log('[Availability API] ✅ Availability synced successfully');

    return NextResponse.json({
      success: true,
      message: 'Availability synced to Google Calendar',
      results: syncResults,
    });
  } catch (error) {
    console.error('[Availability API] Error saving availability:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save availability' },
      { status: 500 }
    );
  }
}
