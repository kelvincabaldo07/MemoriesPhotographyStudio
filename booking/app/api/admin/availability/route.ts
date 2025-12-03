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
  return oauth2Client;
}

function getNotionClient() {
  if (!process.env.NOTION_API_KEY) {
    return null;
  }
  return new Client({ auth: process.env.NOTION_API_KEY });
}

/**
 * GET: Fetch availability from Notion (source of truth)
 */
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
    if (!notion) {
      return NextResponse.json({
        schedule: defaultSchedule,
        blockedDates: [],
        timezone: 'Asia/Manila',
      });
    }

    console.log('[Availability API] Fetching from Notion database:', NOTION_AVAILABILITY_DB);

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

    console.log(`[Availability API] Loaded ${blockedDates.length} blocked dates from Notion`);

    return NextResponse.json({
      schedule: defaultSchedule,
      blockedDates,
      timezone: 'Asia/Manila',
    });
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
 * POST: Save to Notion and sync to Google Calendar (3-way sync)
 */
export async function POST(request: NextRequest) {
  try {
    const data: AvailabilityData = await request.json();
    const { schedule, blockedDates, timezone } = data;

    console.log('[Availability API] Starting 3-way sync...');
    console.log('[Availability API] Notion DB ID:', NOTION_AVAILABILITY_DB);
    console.log('[Availability API] Number of blocked dates to sync:', blockedDates.length);

    const syncResults = {
      notionCreated: 0,
      notionUpdated: 0,
      notionDeleted: 0,
      blockedDatesCreated: 0,
      blockedDatesUpdated: 0,
      blockedDatesDeleted: 0,
      breaksCreated: 0,
      errors: [] as string[],
    };

    // Initialize clients
    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const notion = getNotionClient();

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
      try {
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
        console.log(`[Availability API] Found ${notionRecordsMap.size} existing records in Notion`);
      } catch (error) {
        console.error('[Availability API] Error fetching from Notion:', error);
        syncResults.errors.push('Failed to fetch from Notion: ' + (error as Error).message);
      }
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

          try {
            if (notionPageId && notionRecordsMap.has(blocked.id)) {
              // Update existing
              await notion.pages.update({
                page_id: notionPageId,
                properties: notionProperties,
              });
              syncResults.notionUpdated++;
              notionRecordsMap.delete(blocked.id);
              console.log(`[Availability API] ✅ Updated in Notion: ${blocked.id}`);
            } else {
              // Create new
              const newPage = await notion.pages.create({
                parent: { database_id: NOTION_AVAILABILITY_DB },
                properties: notionProperties,
              });
              notionPageId = newPage.id;
              syncResults.notionCreated++;
              console.log(`[Availability API] ✅ Created in Notion: ${blocked.id}`);
            }
          } catch (notionError) {
            console.error(`[Availability API] Notion error for ${blocked.id}:`, notionError);
            syncResults.errors.push(`Notion sync failed for ${blocked.reason || blocked.id}`);
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
          syncResults.blockedDatesUpdated++;
          calendarEventsMap.delete(existingCalEvent.id);
          console.log(`[Availability API] ✅ Updated in Calendar: ${blocked.id}`);
        } else {
          // Create new
          const createdEvent = await calendar.events.insert({
            calendarId: CALENDAR_ID,
            requestBody: eventData,
          });
          calendarEventId = createdEvent.data.id!;
          syncResults.blockedDatesCreated++;
          console.log(`[Availability API] ✅ Created in Calendar: ${blocked.id}`);
        }

        // C. Update Notion with Calendar Event ID
        if (notion && notionPageId && calendarEventId && NOTION_AVAILABILITY_DB) {
          try {
            await notion.pages.update({
              page_id: notionPageId,
              properties: {
                'Calendar Event ID': {
                  rich_text: [{ text: { content: calendarEventId } }],
                },
              },
            });
            console.log(`[Availability API] ✅ Linked Calendar Event ID in Notion`);
          } catch (linkError) {
            console.error(`[Availability API] Error linking Calendar Event ID:`, linkError);
          }
        }
      } catch (error) {
        console.error(`[Availability API] Error processing blocked date ${blocked.id}:`, error);
        syncResults.errors.push(`Failed to sync ${blocked.reason || blocked.id}: ${(error as Error).message}`);
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
          console.log(`[Availability API] ✅ Archived in Notion: ${blockId}`);
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
        syncResults.blockedDatesDeleted++;
        console.log(`[Availability API] ✅ Deleted from Calendar: ${eventId}`);
      } catch (error) {
        console.error(`[Availability API] Error deleting calendar event:`, error);
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

    console.log('[Availability API] ✅ 3-way sync complete:', syncResults);

    return NextResponse.json({
      success: true,
      message: '3-way sync completed successfully',
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
