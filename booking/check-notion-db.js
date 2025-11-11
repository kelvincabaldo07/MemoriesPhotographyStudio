require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

(async () => {
  try {
    const db = await notion.databases.retrieve({ 
      database_id: process.env.NOTION_SETTINGS_DATABASE_ID 
    });
    
    console.log('📊 Current Notion Settings Database Properties:\n');
    
    Object.entries(db.properties).forEach(([name, prop]) => {
      console.log(`✓ ${name}: ${prop.type}`);
      if (prop.type === 'select' && prop.select?.options) {
        console.log(`  Options: ${prop.select.options.map(o => o.name).join(', ')}`);
      }
    });
    
    console.log('\n📋 Properties needed by the app:');
    const requiredProps = [
      'Lead Time (number)',
      'Lead Time Unit (select: minutes, hours, days)',
      'Booking Slot Size (number)',
      'Booking Slot Unit (select: minutes, hours) ⚠️ MISSING',
      'Scheduling Window (number)',
      'Scheduling Window Unit (select: days, months) ⚠️ MISSING',
      'Cancellation Policy (number)',
      'Cancellation Policy Unit (select: hours, days)'
    ];
    
    requiredProps.forEach(prop => console.log(`  - ${prop}`));
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
