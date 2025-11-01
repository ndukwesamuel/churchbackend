// ===================================
// BIRD WHATSAPP API - NODE.JS
// ===================================

import axios from "axios";

// Configuration
const BIRD_API_KEY = "lBRAXYz7S8kuL14KXU0Ccdte5ZJS04iu07HL"; // Move to .env in production!
const BIRD_API_URL = "https://api.bird.com/v1/messages";
const WHATSAPP_CHANNEL_ID = "YOUR_CHANNEL_ID"; // Get this from Bird dashboard

// ===================================
// SEND WHATSAPP MESSAGE
// ===================================
export async function sendWhatsAppMessage({
  to,
  templateName,
  language = "en",
  parameters = [],
}) {
  try {
    const response = await axios.post(
      BIRD_API_URL,
      {
        to: to, // Phone number with country code: +2348012345678
        channel: WHATSAPP_CHANNEL_ID,
        template: {
          name: templateName,
          language: language,
          components: [
            {
              type: "body",
              parameters: parameters.map((param) => ({
                type: "text",
                text: param,
              })),
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${BIRD_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Message sent successfully:", response.data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error(
      "❌ Error sending message:",
      error.response?.data || error.message
    );

    // Handle specific error cases
    if (error.response) {
      const errorCode = error.response.data?.error?.code;
      const errorMessage = error.response.data?.error?.message;

      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          fullError: error.response.data,
        },
      };
    }

    return {
      success: false,
      error: {
        message: error.message,
      },
    };
  }
}

// ===================================
// SEND TO MULTIPLE RECIPIENTS
// ===================================
export async function sendBulkWhatsAppMessages({
  recipients,
  templateName,
  language = "en",
  getParameters,
}) {
  const results = [];

  for (const recipient of recipients) {
    const parameters = getParameters ? getParameters(recipient) : [];

    const result = await sendWhatsAppMessage({
      to: recipient.phone,
      templateName,
      language,
      parameters,
    });

    results.push({
      phone: recipient.phone,
      ...result,
    });

    // Add delay to avoid rate limiting (adjust as needed)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

// ===================================
// EXAMPLE USAGE
// ===================================

// Example 1: Send a single message
async function example1() {
  const result = await sendWhatsAppMessage({
    to: "+2348012345678",
    templateName: "church_reminder", // Your approved template name
    language: "en",
    parameters: ["Samuel", "Sunday Service", "9:00 AM"],
  });

  console.log(result);
}

// Example 2: Send bulk messages
async function example2() {
  const members = [
    { phone: "+2348012345678", name: "Samuel", event: "Sunday Service" },
    { phone: "+2348087654321", name: "Grace", event: "Bible Study" },
  ];

  const results = await sendBulkWhatsAppMessages({
    recipients: members,
    templateName: "church_reminder",
    language: "en",
    getParameters: (member) => [member.name, member.event, "9:00 AM"],
  });

  console.log(results);
}

// ===================================
// EXPRESS.JS ROUTE EXAMPLE
// ===================================

// If using Express.js, add this route:
/*
import express from 'express';
const app = express();
app.use(express.json());

app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { to, templateName, parameters } = req.body;

    // Validate input
    if (!to || !templateName) {
      return res.status(400).json({
        error: 'Missing required fields: to, templateName'
      });
    }

    const result = await sendWhatsAppMessage({
      to,
      templateName,
      parameters: parameters || []
    });

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

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
*/

// ===================================
// ERROR HANDLING GUIDE
// ===================================

/*
Common error codes you might encounter:

1. TEMPLATE_NOT_APPROVED
   - Your template is pending or rejected
   - Solution: Check Bird dashboard → Templates

2. INSUFFICIENT_BALANCE
   - Wallet has no balance
   - Solution: Add funds to your wallet

3. INVALID_PHONE_NUMBER
   - Phone format is wrong
   - Solution: Use format +2348012345678

4. CHANNEL_NOT_FOUND
   - Wrong channel ID
   - Solution: Check Bird dashboard → Channels

5. UNAUTHORIZED
   - Wrong API key
   - Solution: Verify your access key
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

3. Update code to use .env:
   import dotenv from 'dotenv';
   dotenv.config();
   
   const BIRD_API_KEY = process.env.BIRD_API_KEY;
   const WHATSAPP_CHANNEL_ID = process.env.BIRD_CHANNEL_ID;

4. Get your Channel ID:
   Bird Dashboard → Channels → Copy your WhatsApp channel ID

5. Run:
   node yourfile.js
*/
