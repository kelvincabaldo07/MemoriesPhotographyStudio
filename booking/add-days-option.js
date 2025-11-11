require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

(async () => {
  try {
    console.log('🔍 Checking Lead Time Unit options...\n');
    
    // Get current database schema
    const db = await notion.databases.retrieve({ 
      database_id: process.env.NOTION_SETTINGS_DATABASE_ID 
    });
    
    const leadTimeUnitProp = db.properties['Lead Time Unit'];
    const currentOptions = leadTimeUnitProp.select.options;
    
    console.log('Current options:', currentOptions.map(o => o.name).join(', '));
    
    // Check if "days" already exists
    if (currentOptions.some(o => o.name === 'days')) {
      console.log('✅ "days" option already exists!');
      return;
    }
    
    console.log('➕ Adding "days" option...\n');
    
    // Add the new option while keeping existing ones
    await notion.databases.update({
      database_id: process.env.NOTION_SETTINGS_DATABASE_ID,
      properties: {
        'Lead Time Unit': {
          select: {
            options: [
              ...currentOptions.map(o => ({ name: o.name })),
              { name: 'days', color: 'orange' }
            ]
          }
        }
      }
    });
    
    console.log('✅ Successfully added "days" option to Lead Time Unit');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.body) {
      console.error('Details:', JSON.stringify(err.body, null, 2));
    }
  }
})();
