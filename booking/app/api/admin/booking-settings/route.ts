/**
 * Admin Booking Settings API
 * Manages booking policies: lead time, slot size, scheduling window, cancellation policy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

interface BookingSettings {
  leadTime: number;
  leadTimeUnit: 'minutes' | 'hours' | 'days';
  bookingSlotSize: number;
  bookingSlotUnit: 'minutes' | 'hours';
  schedulingWindow: number;
  schedulingWindowUnit: 'days' | 'months';
  cancellationPolicy: number;
  cancellationPolicyUnit: 'hours' | 'days';
}

/**
 * GET - Fetch current booking settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    

    
    // Check if user is admin (check against allowed emails list)
    const allowedEmails = [
      "smile@memories-studio.com",
      "kelvin.cabaldo@gmail.com",
      process.env.ADMIN_EMAIL,
    ].filter(Boolean);
    
    if (!session || !session.user?.email || !allowedEmails.includes(session.user.email)) {

      return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'You must be logged in as an admin to view settings'
      }, { status: 401 });
    }

    const notionApiKey = process.env.NOTION_API_KEY;
    const settingsDatabaseId = process.env.NOTION_SETTINGS_DATABASE_ID;

    if (!notionApiKey || !settingsDatabaseId) {
      console.warn('[Booking Settings GET] Settings database not configured, returning defaults');
      console.warn('[Booking Settings GET] Add NOTION_SETTINGS_DATABASE_ID to .env.local to persist settings');
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
        usingDefaults: true,
        warning: 'Settings database not configured. Using default values.',
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
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch settings from Notion');
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
        isDefault: true,
      });
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json({
        success: true,
        settings: DEFAULT_SETTINGS,
        isDefault: true,
      });
    }

    const settingsPage = data.results[0];
    const props = settingsPage.properties;

    const settings: BookingSettings = {
      leadTime: props['Lead Time']?.number || DEFAULT_SETTINGS.leadTime,
      leadTimeUnit: (props['Lead Time Unit']?.select?.name as any) || DEFAULT_SETTINGS.leadTimeUnit,
      bookingSlotSize: props['Booking Slot Size']?.number || DEFAULT_SETTINGS.bookingSlotSize,
      bookingSlotUnit: 'minutes',
      schedulingWindow: props['Scheduling Window']?.number || DEFAULT_SETTINGS.schedulingWindow,
      schedulingWindowUnit: 'days',
      cancellationPolicy: props['Cancellation Policy']?.number || DEFAULT_SETTINGS.cancellationPolicy,
      cancellationPolicyUnit: (props['Cancellation Policy Unit']?.select?.name as any) || DEFAULT_SETTINGS.cancellationPolicyUnit,
    };

    return NextResponse.json({
      success: true,
      settings,
      isDefault: false,
      pageId: settingsPage.id,
    });
  } catch (error) {
    console.error('Error fetching booking settings:', error);
    return NextResponse.json({
      success: true,
      settings: DEFAULT_SETTINGS,
      isDefault: true,
    });
  }
}

/**
 * POST - Update booking settings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    

    
    // Check if user is admin (check against allowed emails list)
    const allowedEmails = [
      "smile@memories-studio.com",
      "kelvin.cabaldo@gmail.com",
      process.env.ADMIN_EMAIL,
    ].filter(Boolean);
    
    if (!session || !session.user?.email || !allowedEmails.includes(session.user.email)) {

      return NextResponse.json({ 
        error: 'Unauthorized', 
        message: 'You must be logged in as an admin to save settings' 
      }, { status: 401 });
    }

    const body: BookingSettings = await request.json();

    const notionApiKey = process.env.NOTION_API_KEY;
    const settingsDatabaseId = process.env.NOTION_SETTINGS_DATABASE_ID;

    // If database not configured, still accept the settings but warn
    if (!notionApiKey || !settingsDatabaseId) {
      console.warn('[Booking Settings POST] Settings database not configured. Settings will not persist across deployments.');
      console.warn('[Booking Settings POST] To persist settings, add NOTION_SETTINGS_DATABASE_ID to .env.local');
      console.warn('[Booking Settings POST] See BOOKING_SETTINGS_SETUP.md for instructions');
      
      // Return success but with a warning
      return NextResponse.json({
        success: true,
        warning: 'Settings saved in memory only. To persist settings, configure NOTION_SETTINGS_DATABASE_ID environment variable.',
        message: 'Settings updated successfully (memory only)',
        settings: body,
        needsSetup: true,
      });
    }

    // Check if settings page already exists
    const queryResponse = await fetch(
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
      }
    );

    const queryData = await queryResponse.json();
    const existingPage = queryData.results?.[0];

    const notionPayload = {
      properties: {
        'Setting Type': { select: { name: 'Booking Policies' } },
        'Lead Time': { number: body.leadTime },
        'Lead Time Unit': { select: { name: body.leadTimeUnit } },
        'Booking Slot Size': { number: body.bookingSlotSize },
        'Booking Slot Unit': { select: { name: body.bookingSlotUnit } },
        'Scheduling Window': { number: body.schedulingWindow },
        'Scheduling Window Unit': { select: { name: body.schedulingWindowUnit } },
        'Cancellation Policy': { number: body.cancellationPolicy },
        'Cancellation Policy Unit': { select: { name: body.cancellationPolicyUnit } },
      },
    };

    let response;

    if (existingPage) {
      // Update existing page
      response = await fetch(`https://api.notion.com/v1/pages/${existingPage.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify(notionPayload),
      });
    } else {
      // Create new page
      response = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: { database_id: settingsDatabaseId },
          properties: {
            'Name': { title: [{ text: { content: 'Booking Policies' } }] },
            ...notionPayload.properties,
          },
        }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notion API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'Failed to save settings to Notion' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking settings updated successfully',
      settings: body,
    });
  } catch (error) {
    console.error('Error updating booking settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update booking settings' },
      { status: 500 }
    );
  }
}
