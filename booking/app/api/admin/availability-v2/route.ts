/**
 * Availability API with 3-Way Sync
 * Syncs between: Admin UI ↔ Notion ↔ Google Calendar
 */

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Client } from '@notionhq/client';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const NOTION_AVAILABILITY_DB = process.env.NOTION_AVAILABILITY_DATABASE_ID;

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
  notionId?: string; // Notion page ID
  calendarEventId?: string; // Google Calendar event ID
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

function getNotionClient() {
  if (!process.env.NOTION_API_KEY) {
    throw new Error('NOTION_API_KEY not configured');
  }
  return new Client({ auth: process.env.NOTION_API_KEY });
}

/**
 * GET: Fetch availability from Notion (source of truth)
 */
export async function GET(request: NextRequest) {
  try {
    const defaultSchedule = {
      Monday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
      Tuesday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
      Wednesday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
      Thursday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
      Friday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
      Saturday: { open: "08:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
      Sunday: { open: "13:00", close: "20:00", breaks: [], enabled: true },
    };

    // If Notion not configured, return defaults
    if (!NOTION_AVAILABILITY_DB || !process.env.NOTION_API_KEY) {
      console.log('[Availability API] Notion not configured, returning defaults');
      return NextResponse.json({
        schedule: defaultSchedule,
        blockedDates: [],
        timezone: 'Asia/Manila',
      });
    }

    // Fetch blocked dates from Notion
    const notion = getNotionClient();
    const response = await notion.databases.query({
      database_id: NOTION_AVAILABILITY_DB,
      filter: {
        property: 'Status',
        select: {
          equals: 'Active',
        },
      },
      sorts: [
        {
          property: 'Start Date',
          direction: 'ascending',
        },
      ],
    });

    const blockedDates: BlockedDate[] = response.results.map((page: any) => {
      const props = page.properties;
      return {
        id: props['Block ID']?.rich_text?.[0]?.plain_text || page.id,
        notionId: page.id,
        calendarEventId: props['Calendar Event ID']?.rich_text?.[0]?.plain_text,
        startDate: props['Start Date']?.date?.start?.split('T')[0] || '',
        endDate: props['End Date']?.date?.start?.split('T')[0] || props['Start Date']?.date?.start?.split('T')[0] || '',
        allDay: props['All Day']?.checkbox !== false,
        startTime: props['Start Time']?.rich_text?.[0]?.plain_text,
        endTime: props['End Time']?.rich_text?.[0]?.plain_text,
        reason: props['Reason']?.rich_text?.[0]?.plain_text || props['Name']?.title?.[0]?.plain_text,
      };
    });

    return NextResponse.json({
      schedule: defaultSchedule,
      blockedDates,
      timezone: 'Asia/Manila',
    });
  } catch (error) {
    console.error('[Availability API] Error fetching availability:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

/**
 * POST: Save to Notion and sync to Google Calendar
 */
export async function POST(request: NextRequest) {
  try {
    const data: AvailabilityData = await request.json();
    const { schedule, blockedDates, timezone } = data;

    console.log('[Availability API] Starting 3-way sync...');

    const syncResults = {
      notionCreated: 0,
      notionUpdated: 0,
      notionDeleted: 0,
      calendarCreated: 0,
      calendarUpdated: 0,
      calendarDeleted: 0,
      errors: [] as string[],
    };

    // Initialize clients
    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const notion = NOTION_AVAILABILITY_DB ? getNotionClient() : null;

    // Step 1: Get existing data from both systems
    const now = new Date();
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);

    // Fetch existing Google Calendar events
    const existingCalendarEvents = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      q: '[Studio Blocked]',
      singleEvents: true,
    });

    const calendarEventsMap = new Map(
      (existingCalendarEvents.data.items || []).map(e => [e.id, e])
    );

    // Fetch existing Notion records
    let notionRecordsMap = new Map();
    if (notion && NOTION_AVAILABILITY_DB) {
      const notionResponse = await notion.databases.query({
        database_id: NOTION_AVAILABILITY_DB,
        filter: {
          property: 'Status',
          select: {
            equals: 'Active',
          },
        },
      });

      notionRecordsMap = new Map(
        notionResponse.results.map((page: any) => {
          const blockId = page.properties['Block ID']?.rich_text?.[0]?.plain_text || page.id;
          return [blockId, page];
        })
      );
    }

    // Step 2: Process each blocked date
    for (const blocked of blockedDates) {
      try {
        console.log(`[Availability API] Processing: ${blocked.reason || 'Untitled'} (${blocked.startDate})`);

        // A. Save/Update in Notion
        let notionPageId = blocked.notionId;
        let calendarEventId = blocked.calendarEventId;

        if (notion && NOTION_AVAILABILITY_DB) {
          const notionProperties: any = {
            'Name': {
              title: [{ text: { content: blocked.reason || 'Studio Blocked' } }],
            },
            'Block ID': {
              rich_text: [{ text: { content: blocked.id } }],
            },
            'Start Date': {
              date: { start: blocked.startDate },
            },
            'End Date': {
              date: { start: blocked.endDate },
            },
            'All Day': {
              checkbox: blocked.allDay,
            },
            'Status': {
              select: { name: 'Active' },
            },
            'Last Synced': {
              date: { start: new Date().toISOString() },
            },
          };

          if (blocked.startTime) {
            notionProperties['Start Time'] = {
              rich_text: [{ text: { content: blocked.startTime } }],
            };
          }

          if (blocked.endTime) {
            notionProperties['End Time'] = {
              rich_text: [{ text: { content: blocked.endTime } }],
            };
          }

          if (blocked.reason) {
            notionProperties['Reason'] = {
              rich_text: [{ text: { content: blocked.reason } }],
            };
          }

          if (notionPageId && notionRecordsMap.has(blocked.id)) {
            // Update existing
            await notion.pages.update({
              page_id: notionPageId,
              properties: notionProperties,
            });
            syncResults.notionUpdated++;
            notionRecordsMap.delete(blocked.id);
          } else {
            // Create new
            const newPage = await notion.pages.create({
              parent: { database_id: NOTION_AVAILABILITY_DB },
              properties: notionProperties,
            });
            notionPageId = newPage.id;
            syncResults.notionCreated++;
          }
        }

        // B. Sync to Google Calendar
        const eventData: any = {
          summary: `🚫 [Studio Blocked] ${blocked.reason || 'Unavailable'}`,
          description: `Block ID: ${blocked.id}\n${blocked.reason || 'Studio is not available during this time'}`,
          colorId: '11',
          transparency: 'opaque',
          visibility: 'public',
        };

        if (blocked.allDay) {
          const endDate = new Date(blocked.endDate);
          endDate.setDate(endDate.getDate() + 1);
          eventData.start = { date: blocked.startDate };
          eventData.end = { date: endDate.toISOString().split('T')[0] };
        } else {
          eventData.start = {
            dateTime: `${blocked.startDate}T${blocked.startTime}:00`,
            timeZone: timezone,
          };
          eventData.end = {
            dateTime: `${blocked.endDate}T${blocked.endTime}:00`,
            timeZone: timezone,
          };
        }

        // Find existing calendar event by Block ID
        const existingCalEvent = Array.from(calendarEventsMap.values()).find(e =>
          e.description?.includes(`Block ID: ${blocked.id}`)
        );

        if (existingCalEvent) {
          // Update existing
          await calendar.events.patch({
            calendarId: CALENDAR_ID,
            eventId: existingCalEvent.id!,
            requestBody: eventData,
          });
          calendarEventId = existingCalEvent.id!;
          syncResults.calendarUpdated++;
          calendarEventsMap.delete(existingCalEvent.id);
        } else {
          // Create new
          const createdEvent = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: eventData,
          });
          calendarEventId = createdEvent.data.id!;
          syncResults.calendarCreated++;
        }

        // C. Update Notion with Calendar Event ID
        if (notion && notionPageId && calendarEventId && NOTION_AVAILABILITY_DB) {
          await notion.pages.update({
            page_id: notionPageId,
            properties: {
              'Calendar Event ID': {
                rich_text: [{ text: { content: calendarEventId } }],
              },
            },
          });
        }

      } catch (error) {
        console.error(`[Availability API] Error processing blocked date ${blocked.id}:`, error);
        syncResults.errors.push(`Failed to sync ${blocked.reason || blocked.id}`);
      }
    }

    // Step 3: Delete removed blocked dates
    // Delete from Notion
    if (notion && NOTION_AVAILABILITY_DB) {
      for (const [blockId, page] of notionRecordsMap) {
        try {
          await notion.pages.update({
            page_id: (page as any).id,
            properties: {
              'Status': {
                select: { name: 'Archived' },
              },
            },
          });
          syncResults.notionDeleted++;
        } catch (error) {
          console.error(`[Availability API] Error archiving Notion page:`, error);
        }
      }
    }

    // Delete from Google Calendar
    for (const [eventId, event] of calendarEventsMap) {
      try {
        await calendar.events.delete({
          calendarId: CALENDAR_ID,
          eventId: eventId!,
        });
        syncResults.calendarDeleted++;
      } catch (error) {
        console.error(`[Availability API] Error deleting calendar event:`, error);
      }
    }

    console.log('[Availability API] ✅ 3-way sync complete:', syncResults);

    return NextResponse.json({
      success: true,
      message: '3-way sync completed successfully',
      results: syncResults,
    });
  } catch (error) {
    console.error('[Availability API] Error during sync:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync availability' },
      { status: 500 }
    );
  }
}
