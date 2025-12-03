/**
 * Test Notion Database Connection
 * Verifies the Notion Availability Database ID is correct
 */

require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');

async function testNotionConnection() {
  console.log('\n🔍 Testing Notion Availability Database Connection...\n');

  const notionApiKey = process.env.NOTION_API_KEY;
  const availabilityDbId = process.env.NOTION_AVAILABILITY_DATABASE_ID;
  const servicesDbId = process.env.NOTION_SERVICES_DATABASE_ID;

  console.log('📋 Environment Variables:');
  console.log('  NOTION_API_KEY:', notionApiKey ? '✓ Set' : '✗ Missing');
  console.log('  NOTION_AVAILABILITY_DATABASE_ID:', availabilityDbId || '✗ Missing');
  console.log('  NOTION_SERVICES_DATABASE_ID:', servicesDbId || '✗ Missing');
  console.log();

  if (!notionApiKey) {
    console.error('❌ NOTION_API_KEY not set!');
    return;
  }

  const notion = new Client({ auth: notionApiKey });

  // Test Availability Database
  if (availabilityDbId) {
    console.log('🧪 Test 1: Availability Database');
    console.log('   Database ID:', availabilityDbId);
    
    // Format the ID properly (Notion IDs need hyphens)
    let formattedId = availabilityDbId.replace(/-/g, '');
    if (formattedId.length === 32) {
      formattedId = `${formattedId.slice(0, 8)}-${formattedId.slice(8, 12)}-${formattedId.slice(12, 16)}-${formattedId.slice(16, 20)}-${formattedId.slice(20)}`;
      console.log('   Formatted ID:', formattedId);
    }

    try {
      // Try to query the database
      const response = await notion.databases.query({
        database_id: formattedId,
        page_size: 5,
      });

      console.log('   ✅ Connection successful!');
      console.log('   📊 Found', response.results.length, 'records');
      
      if (response.results.length > 0) {
        console.log('\n   Sample records:');
        response.results.slice(0, 3).forEach((page, index) => {
          const props = page.properties;
          const name = props.Name?.title?.[0]?.plain_text || 'Untitled';
          const startDate = props['Start Date']?.date?.start || 'N/A';
          const status = props.Status?.select?.name || 'N/A';
          console.log(`     ${index + 1}. ${name} - ${startDate} (${status})`);
        });
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message);
      if (error.code === 'object_not_found') {
        console.error('\n   💡 The database ID is incorrect or the integration doesn\'t have access.');
        console.error('      1. Make sure you invited your Notion integration to this database');
        console.error('      2. Check that the database ID is correct');
        console.error('      3. The ID should be the 32-character string from the database URL');
      }
    }
    console.log();
  } else {
    console.log('⚠️  NOTION_AVAILABILITY_DATABASE_ID not set\n');
  }

  // Test Services Database
  if (servicesDbId) {
    console.log('🧪 Test 2: Services Database');
    console.log('   Database ID:', servicesDbId);

    // Format the ID properly
    let formattedId = servicesDbId.replace(/-/g, '');
    if (formattedId.length === 32) {
      formattedId = `${formattedId.slice(0, 8)}-${formattedId.slice(8, 12)}-${formattedId.slice(12, 16)}-${formattedId.slice(16, 20)}-${formattedId.slice(20)}`;
      console.log('   Formatted ID:', formattedId);
    }

    try {
      const response = await notion.databases.query({
        database_id: formattedId,
        filter: {
          property: 'Enabled',
          checkbox: {
            equals: true,
          },
        },
        page_size: 10,
      });

      console.log('   ✅ Connection successful!');
      console.log('   📊 Found', response.results.length, 'enabled services');
      
      if (response.results.length > 0) {
        console.log('\n   Sample services:');
        response.results.slice(0, 5).forEach((page, index) => {
          const props = page.properties;
          const name = props.Name?.title?.[0]?.plain_text || 'Untitled';
          const type = props.Type?.select?.name || 'N/A';
          const enabled = props.Enabled?.checkbox;
          console.log(`     ${index + 1}. ${name} (${type}) - ${enabled ? 'Enabled' : 'Disabled'}`);
        });
      } else {
        console.log('\n   ⚠️  No enabled services found. Make sure services have "Enabled" checkbox checked.');
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message);
      if (error.code === 'object_not_found') {
        console.error('\n   💡 The database ID is incorrect or the integration doesn\'t have access.');
      }
    }
    console.log();
  } else {
    console.log('⚠️  NOTION_SERVICES_DATABASE_ID not set\n');
  }

  // Summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('To fix any issues:');
  console.log('1. Go to your Notion database');
  console.log('2. Click "..." → "Connections" → Add your integration');
  console.log('3. Copy the database ID from the URL (32-character string)');
  console.log('4. Set in .env.local or Vercel environment variables');
  console.log();
}

testNotionConnection();
