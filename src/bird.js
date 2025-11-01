// ===================================
// BIRD WHATSAPP API - NODE.JS
// Send Custom Text Messages (No Templates)
// ===================================

import axios from 'axios';

// Configuration
const BIRD_API_KEY = 'lBRAXYz7S8kuL14KXU0Ccdte5ZJS04iu07HL'; // Move to .env in production!
const BIRD_API_URL = 'https://api.bird.com/v1/messages';
const WHATSAPP_CHANNEL_ID = 'YOUR_CHANNEL_ID'; // Get this from Bird dashboard

// ===================================
// SEND CUSTOM TEXT MESSAGE
// ===================================
export async function sendWhatsAppText({ to, message }) {
  try {
    const response = await axios.post(
      BIRD_API_URL,
      {
        to: to, // Phone number with country code: +2348012345678
        channel: WHATSAPP_CHANNEL_ID,
        type: 'text',
        content: {
          text: message
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${BIRD_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Message sent successfully:', response.data);
    return {
      success: true,
      data: response.data
    };

  } catch (error) {
    console.error('❌ Error sending message:', error.response?.data || error.message);
    
    if (error.response) {
      const errorData = error.response.data;
      
      return {
        success: false,
        error: {
          status: error.response.status,
          message: errorData?.error?.message || errorData?.message,
          details: errorData
        }
      };
    }

    return {
      success: false,
      error: {
        message: error.message
      }
    };
  }
}

// ===================================
// SEND TO MULTIPLE RECIPIENTS
// ===================================
export async function sendBulkWhatsAppText({ recipients, message, personalize = false }) {
  const results = [];

  for (const recipient of recipients) {
    // Personalize message if needed
    let finalMessage = message;
    if (personalize && recipient.name) {
      finalMessage = message.replace('{name}', recipient.name);
    }
    
    const result = await sendWhatsAppText({
      to: recipient.phone,
      message: finalMessage
    });

    results.push({
      phone: recipient.phone,
      name: recipient.name,
      ...result
    });

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

// ===================================
// EXAMPLE USAGE
// ===================================

// Example 1: Send a simple text message
async function example1() {
  const result = await sendWhatsAppText({
    to: '+2348012345678',
    message: 'Welcome to church guys! 🙏 Service starts at 9 AM this Sunday.'
  });

  console.log(result);
}

// Example 2: Send personalized messages to multiple people
async function example2() {
  const members = [
    { phone: '+2348012345678', name: 'Samuel' },
    { phone: '+2348087654321', name: 'Grace' },
    { phone: '+2348098765432', name: 'David' }
  ];

  const results = await sendBulkWhatsAppText({
    recipients: members,
    message: 'Hi {name}! Welcome to church guys! 🙏 See you on Sunday at 9 AM.',
    personalize: true
  });

  console.log(results);
}

// Example 3: Send same message to everyone
async function example3() {
  const members = [
    { phone: '+2348012345678', name: 'Samuel' },
    { phone: '+2348087654321', name: 'Grace' }
  ];

  const results = await sendBulkWhatsAppText({
    recipients: members,
    message: 'Welcome to church guys! Service starts at 9 AM this Sunday. God bless! 🙏',
    personalize: false
  });

  console.log(results);
}

// ===================================
// EXPRESS.JS ROUTES
// ===================================

/*
import express from 'express';
const app = express();
app.use(express.json());

// Send single message
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        error: 'Missing required fields: to, message'
      });
    }

    const result = await sendWhatsAppText({ to, message });

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Send bulk messages
app.post('/api/whatsapp/send-bulk', async (req, res) => {
  try {
    const { recipients, message, personalize } = req.body;

    if (!recipients || !message) {
      return res.status(400).json({
        error: 'Missing required fields: recipients, message'
      });
    }

    const results = await sendBulkWhatsAppText({
      recipients,
      message,
      personalize: personalize || false
    });

    const successCount = results.filter(r => r.success).length;

    return res.json({
      total: results.length,
      successful: successCount,
      failed: results.length - successCount,
      results
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
*/

// ===================================
// TEST THE API
// ===================================

// Uncomment to test:
// example1();

// ===================================
// IMPORTANT NOTES
// ===================================

/*
⚠️ WHATSAPP MESSAGING RULES:

1. **24-Hour Window**: 
   - You can only send custom text messages to users who have 
     messaged you first within the last 24 hours
   - After 24 hours, you MUST use approved templates

2. **First Message**:
   - The user must initiate the conversation OR
   - You must use an approved template

3. **For Broadcast Messages**:
   - If you want to message people who haven't messaged you,
     you'll need to use templates (Meta/WhatsApp requirement)

4. **Solution for Church Broadcasts**:
   - Create a template like: "Hi {{1}}, welcome to church! Service at {{2}}"
   - Get it approved by Meta
   - Then you can send to anyone

If you get an error like "Message failed - outside 24h window",
it means you need to use templates for that contact.
*/

// ===================================
// SETUP INSTRUCTIONS
// ===================================

/*
1. Install dependencies:
   npm install axios dotenv

2. Create .env file:
   BIRD_API_KEY=lBRAXYz7S8kuL14KXU0Ccdte5ZJS04iu07HL
   BIRD_CHANNEL_ID=your_channel_id_here

3. Get your Channel ID:
   - Bird Dashboard → Channels → WhatsApp → Copy Channel ID

4. Update code to use .env:
   import dotenv from 'dotenv';
   dotenv.config();
   
   const BIRD_API_KEY = process.env.BIRD_API_KEY;
   const WHATSAPP_CHANNEL_ID = process.env.BIRD_CHANNEL_ID;

5. Run:
   node yourfil