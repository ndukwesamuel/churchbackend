import nodemailer, { Transporter } from "nodemailer";
// import generateOTP from "./generateOTP.js";
// import OTP from "../models/otp.js";

// Types
interface EmailData {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

interface BulkEmailResult {
  success: number;
  failed: number;
  total: number;
  results: EmailSuccess[];
  errors: EmailError[];
}

interface EmailSuccess {
  success: true;
  recipient: string;
  messageId: string;
  response: string;
}

interface EmailError {
  success: false;
  recipient: string;
  error: string;
}

interface OTPRecipient {
  email: string;
  name: string;
}

interface BulkRecipient {
  email: string;
  name?: string;
  subject?: string;
  message?: string;
}

// Create transporter with optimized settings for bulk sending
const createTransporter = (): Transporter => {
  return nodemailer.createTransporter({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
      user: process.env.BREVO_EMAIL,
      pass: process.env.BREVO_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Optimize for bulk sending
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateLimit: 14, // Max 14 emails per second (Brevo limit)
  });
};

// Single email function
const sendEmail = async ({ to, subject, text, html }: EmailData): Promise<any> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: "Admin@Pausepoint.com",
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}:`, info.response);
    
    transporter.close();
    return info;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
};

// Main bulk email function
const sendBulkEmails = async (emailList: EmailData[]): Promise<BulkEmailResult> => {
  if (!emailList || emailList.length === 0) {
    throw new Error("Email list cannot be empty");
  }

  const transporter = createTransporter();
  const results: EmailSuccess[] = [];
  const errors: EmailError[] = [];

  try {
    console.log(`Starting bulk email send for ${emailList.length} recipients...`);
    
    // Process emails in batches
    const batchSize = 10;
    const batches: EmailData[][] = [];
    
    for (let i = 0; i < emailList.length; i += batchSize) {
      batches.push(emailList.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);
      
      const batchPromises = batch.map(async (emailData: EmailData) => {
        try {
          const mailOptions = {
            from: "Admin@Pausepoint.com",
            to: emailData.to,
            subject: emailData.subject,
            text: emailData.text,
            html: emailData.html,
          };

          const info = await transporter.sendMail(mailOptions);
          
          return {
            success: true as const,
            recipient: emailData.to,
            messageId: info.messageId,
            response: info.response,
          };
        } catch (error: any) {
          console.error(`Error sending email to ${emailData.to}:`, error.message);
          
          return {
            success: false as const,
            recipient: emailData.to,
            error: error.message || 'Unknown error',
          };
        }
      });

      // Wait for current batch to complete
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value);
          } else {
            errors.push(result.value);
          }
        }
      });

      // Add delay between batches to respect rate limits
      if (batchIndex < batches.length - 1) {
        console.log('Waiting 1 second before next batch...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const finalResult: BulkEmailResult = {
      success: results.length,
      failed: errors.length,
      total: emailList.length,
      results,
      errors,
    };

    console.log(`Bulk email completed. Success: ${finalResult.success}, Failed: ${finalResult.failed}`);
    
    return finalResult;

  } catch (error: any) {
    console.error("Critical error in bulk email sending:", error);
    throw error;
  } finally {
    transporter.close();
  }
};

// Send bulk emails with same content to different recipients
const sendBulkSameContent = async (
  recipients: string[], 
  subject: string, 
  content: { text?: string; html?: string }
): Promise<BulkEmailResult> => {
  const emailList: EmailData[] = recipients.map(recipient => ({
    to: recipient,
    subject,
    text: content.text,
    html: content.html,
  }));

  return sendBulkEmails(emailList);
};

// Send bulk emails with personalized content
const sendBulkPersonalized = async (recipients: BulkRecipient[]): Promise<BulkEmailResult> => {
  const emailList: EmailData[] = recipients.map(recipient => {
    const personalizedText = recipient.message 
      ? `Hello ${recipient.name || 'User'},\n\n${recipient.message}`
      : `Hello ${recipient.name || 'User'},\n\nThank you for being part of Pause Point!`;
    
    const personalizedHtml = recipient.message
      ? `<h2>Hello ${recipient.name || 'User'}!</h2><p>${recipient.message}</p>`
      : `<h2>Hello ${recipient.name || 'User'}!</h2><p>Thank you for being part of Pause Point!</p>`;

    return {
      to: recipient.email,
      subject: recipient.subject || "Message from Pause Point",
      text: personalizedText,
      html: personalizedHtml,
    };
  });

  return sendBulkEmails(emailList);
};

// Bulk OTP sending
const sendBulkOTP = async (recipients: OTPRecipient[]): Promise<BulkEmailResult> => {
  const emailList: EmailData[] = [];
  
  for (const recipient of recipients) {
    try {
      // Delete existing OTP
      await OTP.findOneAndDelete({ email: recipient.email });
      
      // Generate new OTP
      const otp = generateOTP();
      await OTP.create({ email: recipient.email, otp });
      
      // Create email content
      const subject = "OTP Verification - Pause Point";
      const text = `Hello ${recipient.name},\n\nYour OTP verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nBest regards,\nPause Point Team`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">OTP Verification</h2>
          <p>Hello <strong>${recipient.name}</strong>,</p>
          <p>Your OTP verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; color: #333; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>Best regards,<br>Pause Point Team</p>
        </div>
      `;
      
      emailList.push({
        to: recipient.email,
        subject,
        text,
        html,
      });
    } catch (error: any) {
      console.error(`Error preparing OTP for ${recipient.email}:`, error);
      // Continue with other recipients even if one fails
    }
  }
  
  return sendBulkEmails(emailList);
};

// Newsletter/announcement to multiple users
const sendBulkNewsletter = async (
  recipients: string[], 
  subject: string, 
  content: string,
  isHtml: boolean = false
): Promise<BulkEmailResult> => {
  const emailData = isHtml 
    ? { html: content }
    : { text: content };

  return sendBulkSameContent(recipients, subject, emailData);
};

// Send welcome emails to new users
const sendBulkWelcome = async (newUsers: { email: string; name: string }[]): Promise<BulkEmailResult> => {
  const recipients: BulkRecipient[] = newUsers.map(user => ({
    email: user.email,
    name: user.name,
    subject: "Welcome to Pause Point!",
    message: `Welcome to Pause Point! We're excited to have you join our community. Get started by exploring our features and connecting with other users.`,
  }));

  return sendBulkPersonalized(recipients);
};

export default {
  sendEmail,
  sendBulkEmails,
  sendBulkSameContent,
  sendBulkPersonalized,
  sendBulkOTP,
  sendBulkNewsletter,
  sendBulkWelcome,
};

export type {
  EmailData,
  BulkEmailResult,
  EmailSuccess,
  EmailError,
  OTPRecipient,
  BulkRecipient,
};