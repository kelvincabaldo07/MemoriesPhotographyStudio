/**
 * Public Booking Settings API
 * Returns booking policies for use in the public booking form
 */

import { NextResponse } from 'next/server';

// Default settings
const DEFAULT_SETTINGS = {
  leadTime: 2, // hours
  leadTimeUnit: 'hours' as 'minutes' | 'hours' | 'days',
  bookingSlotSize: 15, // minutes
  bookingSlotUnit: 'minutes' as 'minutes' | 'hours',
  schedulingWindow: 90, // days
  schedulingWindowUnit: 'days' as 'days' | 'months',
  cancellationPolicy: 2, // hours
  cancellationPolicyUnit: 'hours' as 'hours' | 'days',
};

export async function GET() {
  try {
    const notionApiKey = process.env.NOTION_API_KEY;
    const settingsDatabaseId = process.env.NOTION_SETTINGS_DATABASE_ID;

    if (!notionApiKey || !settingsDatabaseId) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
      });
    }

    // Fetch settings from Notion
    const response = await fetch(
      `https://api.notion.com/v1/databases/${settingsDatabaseId}/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          filter: {
            property: 'Setting Type',
            select: {
              equals: 'Booking Policies',
            },
          },
        }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
      });
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
      });
    }

    const settingsPage = data.results[0];
    const props = settingsPage.properties;

    const settings = {
      leadTime: props['Lead Time']?.number || DEFAULT_SETTINGS.leadTime,
      leadTimeUnit: (props['Lead Time Unit']?.select?.name || DEFAULT_SETTINGS.leadTimeUnit) as 'minutes' | 'hours' | 'days',
      bookingSlotSize: props['Booking Slot Size']?.number || DEFAULT_SETTINGS.bookingSlotSize,
      bookingSlotUnit: (props['Booking Slot Unit']?.select?.name || DEFAULT_SETTINGS.bookingSlotUnit) as 'minutes' | 'hours',
      schedulingWindow: props['Scheduling Window']?.number || DEFAULT_SETTINGS.schedulingWindow,
      schedulingWindowUnit: (props['Scheduling Window Unit']?.select?.name || DEFAULT_SETTINGS.schedulingWindowUnit) as 'days' | 'months',
      cancellationPolicy: props['Cancellation Policy']?.number || DEFAULT_SETTINGS.cancellationPolicy,
      cancellationPolicyUnit: (props['Cancellation Policy Unit']?.select?.name || DEFAULT_SETTINGS.cancellationPolicyUnit) as 'hours' | 'days',
    };

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching booking settings:', error);
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
    });
  }
}
