require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_SERVICES_DATABASE_ID;

async function checkDescriptionField() {
  console.log('\n🔍 Checking description fields in Notion services...\n');
  
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 1, // Just get one page to check field structure
    });

    if (response.results.length > 0) {
      const firstPage = response.results[0];
      const props = firstPage.properties;
      
      console.log('📦 Available properties:');
      console.log(Object.keys(props).join(', '));
      console.log('');
      
      // Check for description-like fields
      console.log('🔎 Looking for description fields:');
      Object.keys(props).forEach(key => {
        if (key.toLowerCase().includes('desc') || key.toLowerCase().includes('detail')) {
          console.log(`\n  ✓ Found: "${key}"`);
          console.log(`    Type: ${props[key].type}`);
          if (props[key].type === 'rich_text' && props[key].rich_text.length > 0) {
            console.log(`    Value: ${props[key].rich_text[0].plain_text.substring(0, 100)}...`);
          }
        }
      });
      
      // Display first service details
      console.log('\n\n📄 First service example:');
      console.log(`  Name: ${props.Name?.title?.[0]?.plain_text || 'N/A'}`);
      console.log(`  Type: ${props.Type?.select?.name || 'N/A'}`);
      console.log(`  Group: ${props.Group?.rich_text?.[0]?.plain_text || 'N/A'}`);
      console.log(`  BasePrice: ${props.BasePrice?.number || 'N/A'}`);
      
      // Try different description field names
      const possibleDescFields = ['Description', 'description', 'Details', 'details', 'Info'];
      possibleDescFields.forEach(field => {
        if (props[field]) {
          console.log(`\n  ✅ "${field}" exists!`);
          console.log(`     Type: ${props[field].type}`);
          if (props[field].type === 'rich_text' && props[field].rich_text.length > 0) {
            console.log(`     Content: ${props[field].rich_text[0].plain_text}`);
          } else {
            console.log(`     (empty or different type)`);
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

checkDescriptionField();
