import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/admin/settings/bcc-emails
 * Get BCC email addresses from settings
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notionApiKey = process.env.NOTION_API_KEY;
    const settingsDbId = process.env.NOTION_SETTINGS_DATABASE_ID;
    
    if (!notionApiKey || !settingsDbId) {
      return NextResponse.json({
        success: true,
        emails: ['smile@memories-studio.com'],
        usingDefaults: true,
        warning: 'Settings database not configured. Using default email.'
      });
    }

    // Query Notion for BCC email settings
    const response = await fetch(`https://api.notion.com/v1/databases/${settingsDbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          property: 'Setting Name',
          rich_text: {
            equals: 'BCC Email Addresses'
          }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const setting = data.results[0];
      const emailsText = setting.properties?.['Value']?.rich_text?.[0]?.plain_text || '';
      const emails = emailsText
        ? emailsText.split(',').map((email: string) => email.trim()).filter(Boolean)
        : ['smile@memories-studio.com'];
      
      return NextResponse.json({
        success: true,
        emails,
        usingDefaults: false
      });
    }
    
    // Setting doesn't exist yet, return default
    return NextResponse.json({
      success: true,
      emails: ['smile@memories-studio.com'],
      usingDefaults: true,
      message: 'BCC email setting not found in database. Using default.'
    });

  } catch (error) {
    console.error('[Settings API] Error fetching BCC emails:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/bcc-emails
 * Save BCC email addresses to settings
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { emails } = await request.json();
    
    if (!Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Invalid email list' },
        { status: 400 }
      );
    }

    const notionApiKey = process.env.NOTION_API_KEY;
    const settingsDbId = process.env.NOTION_SETTINGS_DATABASE_ID;
    
    if (!notionApiKey || !settingsDbId) {
      return NextResponse.json({
        success: false,
        error: 'Settings database not configured',
        warning: 'NOTION_SETTINGS_DATABASE_ID is not set. Emails will not persist.',
        needsSetup: true
      });
    }

    // First, check if setting exists
    const queryResponse = await fetch(`https://api.notion.com/v1/databases/${settingsDbId}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          property: 'Setting Name',
          rich_text: {
            equals: 'BCC Email Addresses'
          }
        }
      })
    });

    const queryData = await queryResponse.json();
    const emailsText = emails.join(', ');
    
    if (queryData.results && queryData.results.length > 0) {
      // Update existing setting
      const settingPageId = queryData.results[0].id;
      const updateResponse = await fetch(`https://api.notion.com/v1/pages/${settingPageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          properties: {
            'Value': {
              rich_text: [{ text: { content: emailsText } }]
            }
          }
        })
      });

      if (!updateResponse.ok) {
        throw new Error(`Failed to update setting: ${updateResponse.statusText}`);
      }


    } else {
      // Create new setting
      const createResponse = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify({
          parent: { database_id: settingsDbId },
          properties: {
            'Setting Name': {
              title: [{ text: { content: 'BCC Email Addresses' } }]
            },
            'Value': {
              rich_text: [{ text: { content: emailsText } }]
            },
            'Description': {
              rich_text: [{ text: { content: 'Email addresses to BCC on booking confirmation emails' } }]
            }
          }
        })
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create setting: ${createResponse.statusText}`);
      }


    }

    return NextResponse.json({
      success: true,
      message: 'BCC email addresses saved successfully',
      emails
    });

  } catch (error) {
    console.error('[Settings API] Error saving BCC emails:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
