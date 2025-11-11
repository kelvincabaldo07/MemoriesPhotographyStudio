require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

(async () => {
  try {
    console.log('🔧 Adding missing properties to Notion Settings Database...\n');
    
    // Update the database schema to add the missing properties
    const response = await notion.databases.update({
      database_id: process.env.NOTION_SETTINGS_DATABASE_ID,
      properties: {
        'Booking Slot Unit': {
          select: {
            options: [
              { name: 'minutes', color: 'blue' },
              { name: 'hours', color: 'green' }
            ]
          }
        },
        'Scheduling Window Unit': {
          select: {
            options: [
              { name: 'days', color: 'blue' },
              { name: 'months', color: 'purple' }
            ]
          }
        }
      }
    });
    
    console.log('✅ Successfully added properties:');
    console.log('  - Booking Slot Unit (select: minutes, hours)');
    console.log('  - Scheduling Window Unit (select: days, months)');
    
    console.log('\n📝 Manually add "days" option to Lead Time Unit:');
    console.log('   1. Open your Notion Settings database');
    console.log('   2. Click on "Lead Time Unit" property');
    console.log('   3. Add new option: "days"');
    
    console.log('\n🎉 All properties are now configured!');
    console.log('\n💡 Now go to your admin settings page and re-save your settings');
    console.log('   This will populate the new unit fields in Notion.');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.body) {
      console.error('Details:', JSON.stringify(err.body, null, 2));
    }
  }
})();
