require('dotenv').config({ path: '.env.local' });
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_SERVICES_DATABASE_ID;

async function checkServices() {
  console.log('\n🔍 Checking all services in Notion...\n');
  
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Enabled',
        checkbox: {
          equals: true,
        },
      },
      sorts: [
        {
          property: 'Name',
          direction: 'ascending',
        },
      ],
    });

    console.log(`📊 Total enabled services: ${response.results.length}\n`);

    // Group by name to find duplicates
    const servicesByName = {};
    
    response.results.forEach((page) => {
      const props = page.properties;
      const name = props.Name?.title?.[0]?.plain_text || 'Unnamed';
      const type = props.Type?.select?.name || '';
      const group = props.Group?.rich_text?.[0]?.plain_text || '';
      const basePrice = props.BasePrice?.number || 0;
      const enabled = props.Enabled?.checkbox !== false;

      if (!servicesByName[name]) {
        servicesByName[name] = [];
      }

      servicesByName[name].push({
        id: page.id,
        name,
        type,
        group,
        basePrice,
        enabled,
      });
    });

    // Display all services
    Object.entries(servicesByName).forEach(([name, services]) => {
      console.log(`📦 ${name}`);
      services.forEach((s, idx) => {
        console.log(`   ${idx + 1}. ₱${s.basePrice} - ${s.type} - ${s.group} ${s.enabled ? '✅' : '❌'}`);
        console.log(`      ID: ${s.id}`);
      });
      if (services.length > 1) {
        console.log(`   ⚠️  ${services.length} services with same name!`);
      }
      console.log('');
    });

    // Find Family/Group Portraits specifically
    console.log('\n🔎 Looking for Family/Group Portraits...\n');
    const familyServices = response.results.filter((page) => {
      const name = page.properties.Name?.title?.[0]?.plain_text || '';
      return name.toLowerCase().includes('family') || name.toLowerCase().includes('group portrait');
    });

    familyServices.forEach((page) => {
      const props = page.properties;
      console.log(`📸 ${props.Name?.title?.[0]?.plain_text}`);
      console.log(`   Type: ${props.Type?.select?.name}`);
      console.log(`   Group: ${props.Group?.rich_text?.[0]?.plain_text}`);
      console.log(`   Base Price: ₱${props.BasePrice?.number}`);
      console.log(`   Duration: ${props.Duration?.number} min`);
      console.log(`   Enabled: ${props.Enabled?.checkbox ? '✅' : '❌'}`);
      console.log(`   Notion ID: ${page.id}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkServices();
