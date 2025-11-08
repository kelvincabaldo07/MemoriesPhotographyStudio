/**
 * Seed Services to Notion Database
 * 
 * Run this script once to populate your Notion services database
 * Usage: npx tsx scripts/seed-services.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_SERVICES_DATABASE_ID = process.env.NOTION_SERVICES_DATABASE_ID;

console.log('Environment check:');
console.log('NOTION_API_KEY:', NOTION_API_KEY ? '✅ Found' : '❌ Missing');
console.log('NOTION_SERVICES_DATABASE_ID:', NOTION_SERVICES_DATABASE_ID ? '✅ Found' : '❌ Missing');
console.log();

interface ServiceData {
  name: string;
  type: "Self-Shoot" | "With Photographer" | "Seasonal Sessions";
  category?: "Classic" | "Digital";
  group: string;
  description: string;
  basePrice: number;
  classicPrice?: number;
  duration: number;
  availableFrom?: number;
  availableUntil?: number;
  specificDates?: string[];
  enabled: boolean;
}

const DEFAULT_SERVICES: ServiceData[] = [
  // Digital Self-Shoot - Solo/Duo
  {
    name: "Digital Solo/Duo 15",
    type: "Self-Shoot",
    group: "Digital Solo/Duo",
    category: "Digital",
    description: "1–2 pax\nUNLIMITED shots for 15 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 250,
    duration: 15,
    enabled: true,
  },
  {
    name: "Digital Solo/Duo 30",
    type: "Self-Shoot",
    group: "Digital Solo/Duo",
    category: "Digital",
    description: "1–2 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 400,
    duration: 30,
    enabled: true,
  },
  {
    name: "Digital Solo/Duo 60",
    type: "Self-Shoot",
    group: "Digital Solo/Duo",
    category: "Digital",
    description: "1–2 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 700,
    duration: 60,
    enabled: true,
  },
  // Digital Self-Shoot - Small Group
  {
    name: "Digital Small Group 15",
    type: "Self-Shoot",
    group: "Digital Small Group",
    category: "Digital",
    description: "3–5 pax\nUNLIMITED shots for 15 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 350,
    duration: 15,
    enabled: true,
  },
  {
    name: "Digital Small Group 30",
    type: "Self-Shoot",
    group: "Digital Small Group",
    category: "Digital",
    description: "3–5 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 600,
    duration: 30,
    enabled: true,
  },
  {
    name: "Digital Small Group 60",
    type: "Self-Shoot",
    group: "Digital Small Group",
    category: "Digital",
    description: "3–5 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 1000,
    duration: 60,
    enabled: true,
  },
  // Digital Self-Shoot - Big Group
  {
    name: "Digital Big Group 30",
    type: "Self-Shoot",
    group: "Digital Big Group",
    category: "Digital",
    description: "6–15 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 800,
    duration: 30,
    enabled: true,
  },
  {
    name: "Digital Big Group 60",
    type: "Self-Shoot",
    group: "Digital Big Group",
    category: "Digital",
    description: "6–15 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)",
    basePrice: 1500,
    duration: 60,
    enabled: true,
  },

  // Classic Self-Shoot - Solo/Duo (with printed copies)
  {
    name: "Classic Solo/Duo 15",
    type: "Self-Shoot",
    group: "Classic Solo/Duo",
    category: "Classic",
    description: "1–2 pax\nUNLIMITED shots for 15 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nINCLUDES PRINTED COPIES",
    basePrice: 350,
    classicPrice: 350,
    duration: 15,
    enabled: true,
  },
  {
    name: "Classic Solo/Duo 30",
    type: "Self-Shoot",
    group: "Classic Solo/Duo",
    category: "Classic",
    description: "1–2 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nINCLUDES PRINTED COPIES",
    basePrice: 500,
    classicPrice: 500,
    duration: 30,
    enabled: true,
  },
  {
    name: "Classic Solo/Duo 60",
    type: "Self-Shoot",
    group: "Classic Solo/Duo",
    category: "Classic",
    description: "1–2 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nINCLUDES PRINTED COPIES",
    basePrice: 800,
    classicPrice: 800,
    duration: 60,
    enabled: true,
  },
  // Classic Self-Shoot - Small Group (with printed copies)
  {
    name: "Classic Small Group 15",
    type: "Self-Shoot",
    group: "Classic Small Group",
    category: "Classic",
    description: "3–5 pax\nUNLIMITED shots for 15 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nINCLUDES PRINTED COPIES",
    basePrice: 450,
    classicPrice: 450,
    duration: 15,
    enabled: true,
  },
  {
    name: "Classic Small Group 30",
    type: "Self-Shoot",
    group: "Classic Small Group",
    category: "Classic",
    description: "3–5 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nINCLUDES PRINTED COPIES",
    basePrice: 700,
    classicPrice: 700,
    duration: 30,
    enabled: true,
  },
  {
    name: "Classic Small Group 60",
    type: "Self-Shoot",
    group: "Classic Small Group",
    category: "Classic",
    description: "3–5 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nINCLUDES PRINTED COPIES",
    basePrice: 1100,
    classicPrice: 1100,
    duration: 60,
    enabled: true,
  },
  // Classic Self-Shoot - Big Group (with printed copies)
  {
    name: "Classic Big Group 30",
    type: "Self-Shoot",
    group: "Classic Big Group",
    category: "Classic",
    description: "6–15 pax\nUNLIMITED shots for 30 minutes\n2 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nINCLUDES PRINTED COPIES",
    basePrice: 900,
    classicPrice: 900,
    duration: 30,
    enabled: true,
  },
  {
    name: "Classic Big Group 60",
    type: "Self-Shoot",
    group: "Classic Big Group",
    category: "Classic",
    description: "6–15 pax\nUNLIMITED shots for 60 minutes\n4 backdrops of choice\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 24 hours)\nINCLUDES PRINTED COPIES",
    basePrice: 1600,
    classicPrice: 1600,
    duration: 60,
    enabled: true,
  },
  // With Photographer - Kids Pre-birthday (Girls)
  {
    name: "Dreamy Rainbow Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Bloom & Blush Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Rainbow Boho Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Pastel Daisies Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Butterfly Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Mermaid Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Girls)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  // With Photographer - Kids Pre-birthday (Boys)
  {
    name: "Racing Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Safari Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Outer Space Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Hot Air Balloon Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Cuddly Bear Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Under the Sea Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Train Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Navy Theme",
    type: "With Photographer",
    group: "Kids Pre-birthday (Boys)",
    description: "Kids 0–7\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  // With Photographer - Adult/Family Shoot
  {
    name: "Adult's Pre-Birthday",
    type: "With Photographer",
    group: "Adult/Family Shoot",
    description: "45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Family/Group Portraits",
    type: "With Photographer",
    group: "Adult/Family Shoot",
    description: "3–8 pax\n45 minutes session in our airconditioned studio\nWITH photographer\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  {
    name: "Maternity Photoshoot",
    type: "With Photographer",
    group: "Adult/Family Shoot",
    description: "45 minutes session in our airconditioned studio\nWITH photographer\nFREE family portraits\nFREE use of all the backdrops and props\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 7 days)",
    basePrice: 1000,
    duration: 45,
    availableFrom: 8,
    availableUntil: 18,
    enabled: true,
  },
  // Seasonal Sessions - Christmas
  {
    name: "2025 Christmas – White & Gold (Solo/Duo)",
    type: "Seasonal Sessions",
    group: "Christmas",
    description: "1–2 pax\n45 minutes session in our airconditioned studio\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 10 days)\nCozy white & gold set",
    basePrice: 1000,
    duration: 45,
    specificDates: ["2025-11-21", "2025-11-28", "2025-12-05", "2025-12-06", "2025-12-13", "2026-11-21", "2026-11-28", "2026-12-05", "2026-12-06", "2026-12-13"],
    enabled: true,
  },
  {
    name: "2025 Christmas – White & Gold (Small Group)",
    type: "Seasonal Sessions",
    group: "Christmas",
    description: "3–5 pax\n45 minutes session in our airconditioned studio\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 10 days)\nCozy white & gold set",
    basePrice: 2000,
    duration: 45,
    specificDates: ["2025-11-21", "2025-11-28", "2025-12-05", "2025-12-06", "2025-12-13", "2026-11-21", "2026-11-28", "2026-12-05", "2026-12-06", "2026-12-13"],
    enabled: true,
  },
  {
    name: "2025 Christmas – White & Gold (Big Group)",
    type: "Seasonal Sessions",
    group: "Christmas",
    description: "6–8 pax\n45 minutes session in our airconditioned studio\nALL ENHANCED photos (will be shared via Shared Lightroom Album within 10 days)\nCozy white & gold set",
    basePrice: 2500,
    duration: 45,
    specificDates: ["2025-11-21", "2025-11-28", "2025-12-05", "2025-12-06", "2025-12-13", "2026-11-21", "2026-11-28", "2026-12-05", "2026-12-06", "2026-12-13"],
    enabled: true,
  },
];

async function createServicePage(service: ServiceData): Promise<void> {
  const properties: any = {
    Name: {
      title: [{ text: { content: service.name } }]
    },
    Type: {
      select: { name: service.type }
    },
    Group: {
      rich_text: [{ text: { content: service.group } }]
    },
    Description: {
      rich_text: [{ text: { content: service.description } }]
    },
    BasePrice: {
      number: service.basePrice
    },
    Duration: {
      number: service.duration
    },
    Enabled: {
      checkbox: service.enabled
    }
  };

  // Optional properties - only add if they exist in the database
  if (service.category) {
    try {
      properties.Category = {
        select: { name: service.category }
      };
    } catch (e) {
      // Skip if property doesn't exist
    }
  }

  if (service.classicPrice !== undefined) {
    try {
      properties.ClassicPrice = {
        number: service.classicPrice
      };
    } catch (e) {
      // Skip if property doesn't exist
    }
  }

  // Note: AvailableFrom and AvailableUntil are skipped for now
  // Add these properties to your Notion database manually if needed:
  // - AvailableFrom (Number)
  // - AvailableUntil (Number)

  const response = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: NOTION_SERVICES_DATABASE_ID },
      properties,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to create ${service.name}: ${JSON.stringify(errorData)}`);
  }

  console.log(`✅ Created: ${service.name}`);
}

async function seedServices() {
  console.log('🌱 Starting services seed...\n');

  if (!NOTION_API_KEY) {
    console.error('❌ NOTION_API_KEY not found in environment variables');
    process.exit(1);
  }

  if (!NOTION_SERVICES_DATABASE_ID) {
    console.error('❌ NOTION_SERVICES_DATABASE_ID not found in environment variables');
    process.exit(1);
  }

  console.log(`📊 Database ID: ${NOTION_SERVICES_DATABASE_ID}`);
  console.log(`📝 Creating ${DEFAULT_SERVICES.length} services...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const service of DEFAULT_SERVICES) {
    try {
      await createServicePage(service);
      successCount++;
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Failed to create ${service.name}:`, error);
      errorCount++;
    }
  }

  console.log(`\n✨ Seed complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${errorCount}`);
}

seedServices().catch(console.error);
