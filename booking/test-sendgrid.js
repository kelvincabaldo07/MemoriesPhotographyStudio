/**
 * SendGrid Email Test Script
 * Run this to test if SendGrid is configured correctly
 * 
 * Usage: node test-sendgrid.js
 */

const sgMail = require('@sendgrid/mail');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const TEST_TO_EMAIL = 'kelvincabaldo07@gmail.com'; // Change this to your email

console.log('🔍 Testing SendGrid Configuration...\n');
console.log('📧 From Email:', FROM_EMAIL);
console.log('📧 To Email:', TEST_TO_EMAIL);
console.log('🔑 API Key:', API_KEY ? `${API_KEY.substring(0, 15)}...` : 'NOT SET');

if (!API_KEY) {
  console.error('\n❌ SENDGRID_API_KEY not found in .env.local');
  process.exit(1);
}

if (!FROM_EMAIL) {
  console.error('\n❌ SENDGRID_FROM_EMAIL not found in .env.local');
  process.exit(1);
}

sgMail.setApiKey(API_KEY);

async function testEmail() {
  try {
    console.log('\n📤 Sending test email...');
    
    const msg = {
      to: TEST_TO_EMAIL,
      from: {
        email: FROM_EMAIL,
        name: 'Memories Photography Studio'
      },
      subject: 'SendGrid Test - Memories Photography Studio',
      text: 'This is a test email from your SendGrid integration. If you received this, SendGrid is working!',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #0b3d2e;">✅ SendGrid Test Successful!</h2>
            <p>This is a test email from your SendGrid integration.</p>
            <p>If you received this, <strong>SendGrid is working correctly!</strong></p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Memories Photography Studio<br>
              Indang, Cavite
            </p>
          </body>
        </html>
      `
    };

    const response = await sgMail.send(msg);
    
    console.log('\n✅ SUCCESS! Email sent successfully!');
    console.log('📊 Status Code:', response[0].statusCode);
    console.log('📨 Message ID:', response[0].headers['x-message-id']);
    console.log('\n🎉 Check your inbox at:', TEST_TO_EMAIL);
    console.log('💡 If you don\'t see it, check your spam folder!');
    
  } catch (error) {
    console.error('\n❌ ERROR sending email:', error.message);
    
    if (error.response) {
      console.error('\n📋 Error Details:');
      console.error('Status:', error.code);
      console.error('Body:', JSON.stringify(error.response.body, null, 2));
      
      if (error.code === 403) {
        console.error('\n⚠️  PERMISSION ERROR: Your sender email might not be verified!');
        console.error('👉 Go to: https://app.sendgrid.com → Settings → Sender Authentication');
        console.error('👉 Verify your email:', FROM_EMAIL);
      }
    }
  }
}

testEmail();
