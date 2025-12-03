/**
 * Test script to verify blocked dates are being created in Google Calendar
 * Run with: node test-blocked-dates.js
 */

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

async function testBlockedDates() {
  console.log('\n🔍 Testing Blocked Dates Creation...\n');

  // Check environment variables
  console.log('📋 Checking environment variables:');
  console.log('  ✓ GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✓ Set' : '✗ Missing');
  console.log('  ✓ GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✓ Set' : '✗ Missing');
  console.log('  ✓ GOOGLE_REFRESH_TOKEN:', process.env.GOOGLE_REFRESH_TOKEN ? '✓ Set' : '✗ Missing');
  console.log('  ✓ GOOGLE_CALENDAR_ID:', process.env.GOOGLE_CALENDAR_ID || 'primary (using default)');
  console.log();

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
    console.error('❌ Missing required Google Calendar credentials!');
    console.error('   Please set up your .env.local file with the required credentials.');
    process.exit(1);
  }

  try {
    // Initialize OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL ? `${process.env.NEXTAUTH_URL}/api/calendar/callback` : 'http://localhost:3000/api/calendar/callback'
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

    console.log('🔍 Searching for existing blocked events...');
    
    // Search for blocked events
    const now = new Date();
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: futureDate.toISOString(),
      q: '[Studio Blocked]',
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    console.log(`\n📅 Found ${events.length} blocked events:\n`);
    
    if (events.length === 0) {
      console.log('  ℹ️  No blocked events found in calendar');
      console.log('\n💡 This means:');
      console.log('   1. You haven\'t saved any blocked dates yet, OR');
      console.log('   2. The events failed to sync to Google Calendar');
      console.log('\n✅ Try this:');
      console.log('   1. Go to /admin/availability in your browser');
      console.log('   2. Add a blocked date (e.g., today until January 9)');
      console.log('   3. Click "Save & Sync to Calendar"');
      console.log('   4. Check the browser console for any errors');
      console.log('   5. Run this test script again');
    } else {
      events.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.summary}`);
        console.log(`     📅 Start: ${event.start?.date || event.start?.dateTime}`);
        console.log(`     📅 End: ${event.end?.date || event.end?.dateTime}`);
        console.log(`     🔒 Transparency: ${event.transparency || 'opaque (busy)'}`);
        console.log(`     📝 Description: ${event.description || 'N/A'}`);
        console.log();
      });
    }

    // Test creating a sample blocked event
    console.log('\n🧪 Testing: Creating a sample blocked event...');
    
    const testEvent = {
      summary: '🚫 [Studio Blocked] TEST - Delete Me',
      description: 'Block ID: test-' + Date.now() + '\nThis is a test blocked date. You can delete this.',
      colorId: '11', // Red
      transparency: 'opaque', // Should block time
      visibility: 'public',
      start: {
        date: new Date().toISOString().split('T')[0], // Today
      },
      end: {
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      },
    };

    const createResponse = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: testEvent,
    });

    console.log('✅ Successfully created test event!');
    console.log('   Event ID:', createResponse.data.id);
    console.log('   View in calendar:', createResponse.data.htmlLink);
    console.log('\n💡 If you can see this event in Google Calendar, the sync is working!');
    console.log('   You can delete the test event from your calendar.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.error('\n💡 Your refresh token might be expired or invalid.');
      console.error('   You need to re-authorize your Google Calendar access.');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Network connection error. Check your internet connection.');
    } else {
      console.error('\n💡 Full error details:');
      console.error(error);
    }
  }
}

testBlockedDates();
