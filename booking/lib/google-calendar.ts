/**
 * Google Calendar Service
 * Handles creating calendar events for bookings
 */

import { google } from 'googleapis';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

interface CalendarEventData {
  bookingId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  service: string;
  serviceType: string;
  duration: number;
  date: string;
  time: string;
  description?: string;
  backdrops?: string[];
  addons?: Record<string, number>;
}

/**
 * Create OAuth2 client with refresh token
 */
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
 * Create a Google Calendar event for a booking
 * Returns the event ID if successful, null if failed
 */
export async function createCalendarEvent(eventData: CalendarEventData): Promise<string | null> {
  // DIAGNOSTIC LOGGING - Track all calendar event creation attempts
  const callStack = new Error().stack;
  const caller = callStack?.split('\n')[2]?.trim() || 'unknown';
  
  console.log('='.repeat(80));
  console.log(`[Calendar Event] CREATE ATTEMPT at ${new Date().toISOString()}`);
  console.log(`[Calendar Event] Booking ID: ${eventData.bookingId}`);
  console.log(`[Calendar Event] Customer: ${eventData.customer.firstName} ${eventData.customer.lastName}`);
  console.log(`[Calendar Event] Date/Time: ${eventData.date} ${eventData.time}`);
  console.log(`[Calendar Event] Called from: ${caller}`);
  console.log('='.repeat(80));
  
  try {
    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const { bookingId, customer, service, serviceType, duration, date, time, description, backdrops, addons } = eventData;

    // Calculate end time (start time + duration + 30 min buffer)
    const [hours, minutes] = time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration + 30; // Include 30-min buffer
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Create ISO datetime strings with Manila timezone
    const startDateTime = `${date}T${time}:00+08:00`;
    const endDateTime = `${date}T${endTime}:00+08:00`;

    // Check if event already exists for this booking ID to prevent duplicates
    try {
      const existingEvents = await calendar.events.list({
        calendarId: CALENDAR_ID,
        timeMin: new Date(`${date}T00:00:00+08:00`).toISOString(),
        timeMax: new Date(`${date}T23:59:59+08:00`).toISOString(),
        q: bookingId, // Search for booking ID in event
      });

      if (existingEvents.data.items && existingEvents.data.items.length > 0) {
        const existing = existingEvents.data.items.find(e => 
          e.description?.includes(`Booking ID: ${bookingId}`)
        );
        
        if (existing) {
          console.log(`⚠️  Calendar event already exists for booking ${bookingId}: ${existing.id}`);
          console.log(`⚠️  Skipping duplicate creation`);
          return existing.id || null;
        }
      }
    } catch (searchError) {
      console.warn('Warning: Could not search for existing events:', searchError);
      // Continue with creation anyway
    }

    // Build event description
    let eventDescription = `Booking ID: ${bookingId}\n\n`;
    eventDescription += `Customer: ${customer.firstName} ${customer.lastName}\n`;
    eventDescription += `Email: ${customer.email}\n`;
    eventDescription += `Phone: ${customer.phone}\n\n`;
    eventDescription += `Service: ${service}\n`;
    eventDescription += `Type: ${serviceType}\n`;
    eventDescription += `Duration: ${duration} minutes (+ 30 min buffer)\n\n`;
    
    if (description) {
      eventDescription += `Details:\n${description}\n\n`;
    }
    
    if (backdrops && backdrops.length > 0) {
      eventDescription += `Backdrops: ${backdrops.join(', ')}\n\n`;
    }
    
    if (addons && Object.keys(addons).length > 0) {
      const addonsList = Object.entries(addons)
        .filter(([_, qty]) => qty > 0)
        .map(([name, qty]) => `${name} (×${qty})`)
        .join(', ');
      if (addonsList) {
        eventDescription += `Add-ons: ${addonsList}\n\n`;
      }
    }
    
    eventDescription += `Studio: Memories Photography Studio\n`;
    eventDescription += `Location: Indang, Cavite\n`;
    eventDescription += `Google Maps: https://maps.app.goo.gl/kcjjzkZnvvpxJmQL9`;

    // Create event with proper organizer information
    const event = {
      summary: `📸 ${service} - ${customer.firstName} ${customer.lastName}`,
      description: eventDescription,
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Manila',
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'Asia/Manila',
      },
      location: 'Memories Photography Studio, Indang, Cavite',
      organizer: {
        email: CALENDAR_ID,
        displayName: 'Memories Photography Studio',
        self: true,
      },
      attendees: [
        { email: customer.email, displayName: `${customer.firstName} ${customer.lastName}`, responseStatus: 'needsAction' },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 120 },      // 2 hours before
          { method: 'popup', minutes: 30 },       // 30 minutes before
        ],
      },
      colorId: '10', // Green color for confirmed bookings
      conferenceData: undefined,
      guestsCanModify: false,
      guestsCanInviteOthers: false,
      guestsCanSeeOtherGuests: false,
      sendUpdates: 'all', // Send email invitations to attendees
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
      sendUpdates: 'all', // Send calendar invites to all attendees
    });

    console.log('✅ Calendar event created:', response.data.id);
    console.log('🔗 Event link:', response.data.htmlLink);
    
    return response.data.id || null;
  } catch (error) {
    console.error('❌ Google Calendar event creation error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return null;
  }
}

/**
 * Update an existing calendar event
 */
export async function updateCalendarEvent(
  eventId: string,
  eventData: Partial<CalendarEventData>
): Promise<boolean> {
  try {
    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get existing event first
    const existingEvent = await calendar.events.get({
      calendarId: CALENDAR_ID,
      eventId: eventId,
    });

    if (!existingEvent.data) {
      console.error('Event not found:', eventId);
      return false;
    }

    // Build update payload (only update provided fields)
    const updatePayload: any = {};

    if (eventData.date && eventData.time && eventData.duration) {
      const [hours, minutes] = eventData.time.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + eventData.duration + 30;
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

      updatePayload.start = {
        dateTime: `${eventData.date}T${eventData.time}:00+08:00`,
        timeZone: 'Asia/Manila',
      };
      updatePayload.end = {
        dateTime: `${eventData.date}T${endTime}:00+08:00`,
        timeZone: 'Asia/Manila',
      };
    }

    if (eventData.customer || eventData.service) {
      const currentSummary = existingEvent.data.summary || '';
      if (eventData.service && eventData.customer) {
        updatePayload.summary = `📸 ${eventData.service} - ${eventData.customer.firstName} ${eventData.customer.lastName}`;
      } else if (eventData.service) {
        updatePayload.summary = currentSummary.replace(/📸 .*? -/, `📸 ${eventData.service} -`);
      }
    }

    await calendar.events.patch({
      calendarId: CALENDAR_ID,
      eventId: eventId,
      requestBody: updatePayload,
      sendUpdates: 'all',
    });

    console.log('✅ Calendar event updated:', eventId);
    return true;
  } catch (error) {
    console.error('❌ Google Calendar event update error:', error);
    return false;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  try {
    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId: eventId,
      sendUpdates: 'all', // Notify attendees of cancellation
    });

    console.log('✅ Calendar event deleted:', eventId);
    return true;
  } catch (error: any) {
    // Handle case where event is already deleted (410 Gone)
    if (error.code === 410 || error.status === 410) {
      console.log('ℹ️  Calendar event already deleted:', eventId);
      return true; // Consider it a success since the end result is the same
    }
    
    // Handle case where event doesn't exist (404 Not Found)
    if (error.code === 404 || error.status === 404) {
      console.log('ℹ️  Calendar event not found (may have been deleted):', eventId);
      return true; // Consider it a success since the event is gone
    }
    
    console.error('❌ Google Calendar event deletion error:', error);
    console.error('Error code:', error.code, 'Status:', error.status);
    return false;
  }
}
