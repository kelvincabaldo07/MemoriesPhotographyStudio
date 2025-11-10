/**
 * Test Notion Webhook Endpoint
 * Tests the webhook handler with sample data
 */

// Test with a sample booking creation event
async function testWebhook() {
  const webhookUrl = 'https://book.memories-studio.com/api/webhooks/notion';
  
  // Sample payload that Notion would send
  const testPayload = {
    object: 'page',
    event: 'page.created',
    data: {
      id: 'test-page-id-12345',
      properties: {
        'Booking ID': {
          title: [{ plain_text: 'TEST-WEBHOOK-001' }]
        },
        'Status': {
          select: { name: 'Confirmed' }
        },
        'First Name': {
          rich_text: [{ plain_text: 'Test' }]
        },
        'Last Name': {
          rich_text: [{ plain_text: 'User' }]
        },
        'Email': {
          email: 'test@example.com'
        },
        'Phone': {
          phone_number: '09064694122'
        },
        'Service': {
          select: { name: 'Solo/Duo 30' }
        },
        'Service Type': {
          select: { name: 'Self-Shoot' }
        },
        'Duration': {
          number: 30
        },
        'Date': {
          date: { start: '2025-11-12' }
        },
        'Time': {
          rich_text: [{ plain_text: '14:00' }]
        }
      }
    }
  };

  console.log('🧪 Testing Notion Webhook...');
  console.log('📤 Sending test payload to:', webhookUrl);
  console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));
  console.log('');

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No authorization header for now - webhook will accept without it
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Webhook test successful!');
      console.log('Next steps:');
      console.log('1. Check Vercel logs for detailed processing');
      console.log('2. Check Google Calendar for new event');
      console.log('3. Check Notion for Calendar Event ID');
    } else {
      console.log('\n❌ Webhook test failed!');
      console.log('Check the error message above for details.');
    }
  } catch (error) {
    console.error('❌ Error testing webhook:', error);
  }
}

// Run the test
testWebhook();
