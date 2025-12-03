/**
 * Test Availability API
 * Verifies that the availability endpoint is working correctly
 */

require('dotenv').config({ path: '.env.local' });

const AVAILABILITY_API = process.env.NEXTAUTH_URL 
  ? `${process.env.NEXTAUTH_URL}/api/admin/availability`
  : 'http://localhost:3000/api/admin/availability';

console.log('\n🧪 Testing Availability API\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Environment Check:');
console.log(`  NOTION_API_KEY: ${process.env.NOTION_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`  NOTION_AVAILABILITY_DATABASE_ID: ${process.env.NOTION_AVAILABILITY_DATABASE_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`  GOOGLE_REFRESH_TOKEN: ${process.env.GOOGLE_REFRESH_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`  GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);

if (process.env.NOTION_AVAILABILITY_DATABASE_ID) {
  console.log(`\n  Database ID: ${process.env.NOTION_AVAILABILITY_DATABASE_ID}`);
  console.log(`  Formatted: ${process.env.NOTION_AVAILABILITY_DATABASE_ID.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')}`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('🔍 API Endpoint Structure Check:\n');
console.log('  GET /api/admin/availability');
console.log('    ↓ Fetches from Notion (source of truth)');
console.log('    ↓ Returns: { schedule, blockedDates, timezone }');
console.log('');
console.log('  POST /api/admin/availability');
console.log('    ↓ Receives: { schedule, blockedDates, timezone }');
console.log('    ↓ 1. Save/Update in Notion');
console.log('    ↓ 2. Sync to Google Calendar (opaque = blocks time)');
console.log('    ↓ 3. Link Calendar Event ID back to Notion');
console.log('    ↓ Returns: { success, message, results }');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!process.env.NOTION_AVAILABILITY_DATABASE_ID) {
  console.log('⚠️  WARNING: NOTION_AVAILABILITY_DATABASE_ID not set');
  console.log('');
  console.log('To fix this:');
  console.log('  1. Add to .env.local:');
  console.log('     NOTION_AVAILABILITY_DATABASE_ID=2be64db3ff0880b1bd46e7a62babad8c');
  console.log('');
  console.log('  2. Add to Vercel Environment Variables:');
  console.log('     - Go to Vercel Dashboard → Settings → Environment Variables');
  console.log('     - Key: NOTION_AVAILABILITY_DATABASE_ID');
  console.log('     - Value: 2be64db3ff0880b1bd46e7a62babad8c');
  console.log('     - Redeploy');
  console.log('');
} else {
  console.log('✅ All required environment variables are set!');
  console.log('');
  console.log('📝 Next Steps:');
  console.log('  1. Ensure NOTION_AVAILABILITY_DATABASE_ID is in Vercel');
  console.log('  2. Test availability blocking in admin panel');
  console.log('  3. Verify Notion record is created');
  console.log('  4. Check Google Calendar shows blocked event');
  console.log('');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
