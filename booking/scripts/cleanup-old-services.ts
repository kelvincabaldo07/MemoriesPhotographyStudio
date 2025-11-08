/**
 * Cleanup Old Services from Notion Database
 * 
 * This script removes the old services (before the Classic/Digital split)
 * Run this script to clean up duplicate services
 * Usage: npx tsx scripts/cleanup-old-services.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_SERVICES_DATABASE_ID = process.env.NOTION_SERVICES_DATABASE_ID;

// Old service names to delete (services without "Digital" or "Classic" prefix)
const OLD_SERVICE_NAMES = [
  "Solo/Duo 15",
  "Solo/Duo 30",
  "Solo/Duo 60",
  "Small Group 15",
  "Small Group 30",
  "Small Group 60",
  "Big Group 30",
  "Big Group 60",
];

async function getAllServices() {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${NOTION_SERVICES_DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch services: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
}

async function deleteService(pageId: string, serviceName: string) {
  const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      archived: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete ${serviceName}: ${response.statusText}`);
  }

  console.log(`🗑️  Deleted: ${serviceName}`);
}

async function cleanupOldServices() {
  console.log('🧹 Starting cleanup of old services...\n');
  console.log('📊 Database ID:', NOTION_SERVICES_DATABASE_ID);
  console.log('🔍 Fetching all services...\n');

  const allServices = await getAllServices();
  console.log(`Found ${allServices.length} total services\n`);

  let deletedCount = 0;
  let skippedCount = 0;

  for (const service of allServices) {
    const nameProperty = service.properties.Name;
    const serviceName = nameProperty?.title?.[0]?.text?.content || 'Unknown';

    if (OLD_SERVICE_NAMES.includes(serviceName)) {
      try {
        await deleteService(service.id, serviceName);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete ${serviceName}:`, error);
      }
    } else {
      skippedCount++;
    }
  }

  console.log('\n✨ Cleanup complete!');
  console.log(`🗑️  Deleted: ${deletedCount}`);
  console.log(`✅ Kept: ${skippedCount}`);
}

cleanupOldServices().catch(console.error);
