/**
 * Resend Email Test Script
 * Run this to test if Resend is configured correctly
 * 
 * Usage: node test-resend.js
 */

const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

// Configuration
const API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL;

// Color codes for console
console.log('🔍 Testing Resend Configuration...\n');

// Check if environment variables are set
if (!API_KEY) {
  console.error('\n❌ RESEND_API_KEY not found in .env.local');
  console.error('👉 Get your API key from: https://resend.com/api-keys\n');
  process.exit(1);
}

if (!FROM_EMAIL) {
  console.error('\n❌ FROM_EMAIL not found in .env.local');
  console.error('👉 Set your verified sender email (e.g., noreply@memories-studio.com)\n');
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('📧 FROM_EMAIL:', FROM_EMAIL);
console.log('\n⏳ Attempting to send test email...\n');

// Initialize Resend
const resend = new Resend(API_KEY);

// Test email
(async () => {
  try {
    const { data, error } = await resend.emails.send({
      from: `Memories Photography Studio <${FROM_EMAIL}>`,
      to: ['delivered@resend.dev'], // Resend's test email address
      subject: 'Resend Test - Memories Photography Studio',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            h2 { color: #0b3d2e; }
            .success { color: #28a745; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 style="color: #0b3d2e;">✅ Resend Test Successful!</h2>
            <p>This is a test email from your Resend integration.</p>
            <p>If you received this, <strong>Resend is working correctly!</strong></p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Memories Photography Studio<br>
              Indang, Cavite<br>
              Email: smile@memories-studio.com<br>
              Phone: 0906 469 4122
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('\n❌ Resend API Error:', error);
      console.error('\n🔧 Troubleshooting:');
      console.error('1. Verify your RESEND_API_KEY is correct');
      console.error('2. Make sure FROM_EMAIL is verified in Resend dashboard');
      console.error('3. Check if your domain is properly configured');
      console.error('👉 Go to: https://resend.com/domains\n');
      process.exit(1);
    }

    console.log('\n✅✅✅ SUCCESS! ✅✅✅');
    console.log('\n📧 Test email sent successfully!');
    console.log('📝 Email ID:', data.id);
    console.log('\n🎉 Resend is properly configured and working!');
    console.log('\n💡 Note: Test email was sent to delivered@resend.dev (Resend test address)');
    console.log('   To test with a real email, change the "to" address in the script.\n');
    
  } catch (error) {
    console.error('\n❌ Unexpected Error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure you have installed the resend package: npm install resend');
    console.error('2. Check your .env.local file has the correct variables');
    console.error('3. Verify your API key at: https://resend.com/api-keys\n');
    process.exit(1);
  }
})();
