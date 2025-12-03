/**
 * Test script to verify 3-way availability sync
 * Tests: Admin UI ↔ Notion ↔ Google Calendar
 */

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');
const { Client } = require('@notionhq/client');

async function testAvailabilitySync() {
  console.log('\n🔄 Testing 3-Way Availability Sync...\n');

  // Check environment variables
  console.log('📋 Checking environment variables:');
  console.log('  Google Calendar:');
  console.log('    ✓ GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓' : '✗');
  console.log('    ✓ GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓' : '✗');
  console.log('    ✓ GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? '✓' : '✗');
  console.log('    ✓ GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID || 'primary');
  console.log('  Notion:');
  console.log('    ✓ NOTION_API_KEY:', process.env.NOTION_API_KEY ? '✓' : '✗');
  console.log('    ✓ NOTION_AVAILABILITY_DATABASE_ID:', process.env.NOTION_AVAILABILITY_DATABASE_ID ? '✓' : '✗');
  console.log('    ✓ NOTION_SERVICES_DATABASE_ID:', process.env.NOTION_SERVICES_DATABASE_ID ? '✓' : '✗');
  console.log();

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REFRESH_TOKEN) {
    console.error('❌ Missing Google Calendar credentials!');
    return;
  }

  if (!process.env.NOTION_API_KEY) {
    console.error('❌ Missing Notion API credentials!');
    return;
  }

  try {
    // Test 1: Google Calendar Connection
    console.log('🧪 Test 1: Google Calendar Connection');
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL || 'http://localhost:3000/api/calendar/callback'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

    const now = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);

    const calendarResponse = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      q: '[Studio Blocked]',
      singleEvents: true,
    });

    const blockedEvents = calendarResponse.data.items || [];
    console.log(`   ✅ Connected! Found ${blockedEvents.length} blocked events in Calendar`);
    console.log();

    // Test 2: Notion Connection
    console.log('🧪 Test 2: Notion Databases Connection');
    const notion = new Client({ auth: process.env.NOTION_API_KEY });

    // Test Services Database
    if (process.env.NOTION_SERVICES_DATABASE_ID) {
      try {
        const servicesResponse = await notion.databases.query({
          database_id: process.env.NOTION_SERVICES_DATABASE_ID,
          page_size: 5,
        });
        console.log(`   ✅ Services Database: Connected! (${servicesResponse.results.length} services found)`);
      } catch (error) {
        console.log(`   ⚠️  Services Database: ${error.message}`);
      }
    } else {
      console.log('   ℹ️  Services Database: Not configured');
    }

    // Test Availability Database
    if (process.env.NOTION_AVAILABILITY_DATABASE_ID) {
      try {
        const availabilityResponse = await notion.databases.query({
          database_id: process.env.NOTION_AVAILABILITY_DATABASE_ID,
          page_size: 10,
        });
        console.log(`   ✅ Availability Database: Connected! (${availabilityResponse.results.length} blocked dates found)`);
        
        // Show sample blocked dates from Notion
        if (availabilityResponse.results.length > 0) {
          console.log('\n   📅 Sample blocked dates in Notion:');
          availabilityResponse.results.slice(0, 3).forEach((page, index) => {
            const props = page.properties;
            const name = props.Name?.title?.[0]?.plain_text || 'Untitled';
            const startDate = props['Start Date']?.date?.start;
            const status = props.Status?.select?.name || 'N/A';
            console.log(`      ${index + 1}. ${name} (${startDate}) - ${status}`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Availability Database: ${error.message}`);
        console.log('\n   💡 Create the Notion Availability Database following AVAILABILITY_SYNC_SETUP.md');
      }
    } else {
      console.log('   ⚠️  Availability Database: Not configured');
      console.log('      Add NOTION_AVAILABILITY_DATABASE_ID to .env.local');
      console.log('      See AVAILABILITY_SYNC_SETUP.md for setup instructions');
    }
    console.log();

    // Test 3: Sync Status
    console.log('🧪 Test 3: Sync Status Check');
    if (process.env.NOTION_AVAILABILITY_DATABASE_ID) {
      // Compare Google Calendar events with Notion records
      const availabilityResponse = await notion.databases.query({
        database_id: process.env.NOTION_AVAILABILITY_DATABASE_ID,
        filter: {
          property: 'Status',
          select: {
            equals: 'Active',
          },
        },
      });

      const notionBlocks = availabilityResponse.results;
      console.log(`   📊 Google Calendar: ${blockedEvents.length} blocked events`);
      console.log(`   📊 Notion: ${notionBlocks.length} active blocked dates`);
      
      if (blockedEvents.length !== notionBlocks.length) {
        console.log(`   ⚠️  Mismatch detected! Run sync from /admin/availability to fix.`);
      } else {
        console.log(`   ✅ Counts match!`);
      }
    }
    console.log();

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Google Calendar: Connected');
    console.log(process.env.NOTION_SERVICES_DATABASE_ID ? '✅' : '⚠️ ', 'Notion Services: ', process.env.NOTION_SERVICES_DATABASE_ID ? 'Connected' : 'Not configured');
    console.log(process.env.NOTION_AVAILABILITY_DATABASE_ID ? '✅' : '⚠️ ', 'Notion Availability: ', process.env.NOTION_AVAILABILITY_DATABASE_ID ? 'Connected' : 'Not configured');
    console.log();
    console.log('💡 Next Steps:');
    if (!process.env.NOTION_AVAILABILITY_DATABASE_ID) {
      console.log('   1. Create Notion Availability Database (see AVAILABILITY_SYNC_SETUP.md)');
      console.log('   2. Add NOTION_AVAILABILITY_DATABASE_ID to .env.local');
      console.log('   3. Run this test again');
    } else {
      console.log('   1. Go to http://localhost:3000/admin/availability');
      console.log('   2. Add/edit blocked dates');
      console.log('   3. Click "Save & Sync to Calendar"');
      console.log('   4. Check both Notion and Google Calendar for updates');
    }
    console.log();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

testAvailabilitySync();
