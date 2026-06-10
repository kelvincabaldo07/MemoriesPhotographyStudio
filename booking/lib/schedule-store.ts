/**
 * Schedule Store
 * Shared utility for managing the weekly schedule (working hours + breaks).
 * Persists to the Notion settings database when NOTION_SETTINGS_DATABASE_ID is configured.
 */

export interface TimeSlot {
  id: string;
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface DayHours {
  open: string;   // HH:MM
  close: string;  // HH:MM
  breaks: TimeSlot[];
  enabled: boolean;
}

export type WeekSchedule = {
  [day: string]: DayHours;
};

/** Default weekly schedule — weekdays have a lunch break 11:30 AM - 1:30 PM */
export const DEFAULT_SCHEDULE: WeekSchedule = {
  Monday:    { open: "10:00", close: "20:00", breaks: [{ id: "1", start: "11:30", end: "13:30" }], enabled: true },
  Tuesday:   { open: "10:00", close: "20:00", breaks: [{ id: "1", start: "11:30", end: "13:30" }], enabled: true },
  Wednesday: { open: "10:00", close: "20:00", breaks: [{ id: "1", start: "11:30", end: "13:30" }], enabled: true },
  Thursday:  { open: "10:00", close: "20:00", breaks: [{ id: "1", start: "11:30", end: "13:30" }], enabled: true },
  Friday:    { open: "10:00", close: "20:00", breaks: [{ id: "1", start: "11:30", end: "13:30" }], enabled: true },
  Saturday:  { open: "10:00", close: "20:00", breaks: [{ id: "1", start: "12:00", end: "13:00" }], enabled: true },
  Sunday:    { open: "13:00", close: "20:00", breaks: [], enabled: true },
};

/** Convert "HH:MM" string to total minutes */
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** Return the DayHours for a given YYYY-MM-DD date string using the provided schedule */
export function getDayHours(dateStr: string, schedule: WeekSchedule): DayHours | null {
  const date = new Date(dateStr + 'T12:00:00');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = dayNames[date.getDay()];
  const hours = schedule[dayName];
  if (!hours || !hours.enabled) return null;
  return hours;
}

function notionHeaders(apiKey: string) {
  return {
    'Authorization': 'Bearer ' + apiKey,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28',
  };
}

function notionGetHeaders(apiKey: string) {
  return {
    'Authorization': 'Bearer ' + apiKey,
    'Notion-Version': '2022-06-28',
  };
}

/**
 * Load the weekly schedule from Notion settings.
 * Falls back to DEFAULT_SCHEDULE when Notion is not configured or the page is absent.
 */
export async function loadSchedule(): Promise<WeekSchedule> {
  const notionApiKey = process.env.NOTION_API_KEY;
  const settingsDatabaseId = process.env.NOTION_SETTINGS_DATABASE_ID;

  if (!notionApiKey || !settingsDatabaseId) {
    return DEFAULT_SCHEDULE;
  }

  try {
    const queryResponse = await fetch(
      'https://api.notion.com/v1/databases/' + settingsDatabaseId + '/query',
      {
        method: 'POST',
        headers: notionHeaders(notionApiKey),
        body: JSON.stringify({
          filter: { property: 'Setting Type', select: { equals: 'Schedule' } },
        }),
        cache: 'no-store',
      }
    );

    if (!queryResponse.ok) return DEFAULT_SCHEDULE;

    const queryData = await queryResponse.json();
    if (!queryData.results?.length) return DEFAULT_SCHEDULE;

    const pageId = queryData.results[0].id;

    const blocksResponse = await fetch(
      'https://api.notion.com/v1/blocks/' + pageId + '/children',
      {
        headers: notionGetHeaders(notionApiKey),
        cache: 'no-store',
      }
    );

    if (!blocksResponse.ok) return DEFAULT_SCHEDULE;

    const blocksData = await blocksResponse.json();
    const textContent: string = blocksData.results?.[0]?.paragraph?.rich_text?.[0]?.text?.content ?? '';

    if (!textContent) return DEFAULT_SCHEDULE;

    const parsed: WeekSchedule = JSON.parse(textContent);
    return { ...DEFAULT_SCHEDULE, ...parsed };
  } catch (error) {
    console.error('[Schedule Store] Error loading schedule:', error);
    return DEFAULT_SCHEDULE;
  }
}

/**
 * Persist the weekly schedule to Notion settings.
 * No-ops (with a warning) when Notion is not configured.
 * Returns true on success, false on failure.
 */
export async function saveSchedule(schedule: WeekSchedule): Promise<boolean> {
  const notionApiKey = process.env.NOTION_API_KEY;
  const settingsDatabaseId = process.env.NOTION_SETTINGS_DATABASE_ID;

  if (!notionApiKey || !settingsDatabaseId) {
    console.warn('[Schedule Store] Notion not configured - schedule not persisted');
    return false;
  }

  try {
    const scheduleJson = JSON.stringify(schedule);

    const queryResponse = await fetch(
      'https://api.notion.com/v1/databases/' + settingsDatabaseId + '/query',
      {
        method: 'POST',
        headers: notionHeaders(notionApiKey),
        body: JSON.stringify({
          filter: { property: 'Setting Type', select: { equals: 'Schedule' } },
        }),
      }
    );

    const queryData = await queryResponse.json();
    const existingPage = queryData.results?.[0];

    let pageId: string;

    if (existingPage) {
      pageId = existingPage.id;

      const blocksResponse = await fetch(
        'https://api.notion.com/v1/blocks/' + pageId + '/children',
        { headers: notionGetHeaders(notionApiKey) }
      );
      const blocksData = await blocksResponse.json();

      for (const block of (blocksData.results ?? [])) {
        await fetch('https://api.notion.com/v1/blocks/' + block.id, {
          method: 'DELETE',
          headers: notionGetHeaders(notionApiKey),
        });
      }
    } else {
      const createResponse = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: notionHeaders(notionApiKey),
        body: JSON.stringify({
          parent: { database_id: settingsDatabaseId },
          properties: {
            Name: { title: [{ text: { content: 'Schedule' } }] },
            'Setting Type': { select: { name: 'Schedule' } },
          },
        }),
      });

      if (!createResponse.ok) {
        console.error('[Schedule Store] Failed to create Notion page');
        return false;
      }

      const newPage = await createResponse.json();
      pageId = newPage.id;
    }

    const addBlockResponse = await fetch(
      'https://api.notion.com/v1/blocks/' + pageId + '/children',
      {
        method: 'PATCH',
        headers: notionHeaders(notionApiKey),
        body: JSON.stringify({
          children: [
            {
              type: 'paragraph',
              paragraph: {
                rich_text: [{ type: 'text', text: { content: scheduleJson } }],
              },
            },
          ],
        }),
      }
    );

    if (!addBlockResponse.ok) {
      console.error('[Schedule Store] Failed to write schedule block');
      return false;
    }

    console.log('[Schedule Store] Schedule saved to Notion');
    return true;
  } catch (error) {
    console.error('[Schedule Store] Error saving schedule:', error);
    return false;
  }
}
