import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import axios from "axios";
import nodemailer from "nodemailer";

const TERMII_BASE_URL = process.env.TERMII_BASE_URL;
const TERMII_API_KEY = process.env.TERMII_API_KEY;

const EMAIL_HOST = "smtp-relay.brevo.com"; // process.env.EMAIL_HOST; // e.g. smtp.gmail.com or smtp.office365.com
// const EMAIL_PORT = 587; //Number(process.env.EMAIL_PORT) || 587; // usually 465 (SSL) or 587 (TLS)
const EMAIL_USER = "75e89f001@smtp-brevo.com"; //process.env.EMAIL_USER;
const EMAIL_PASS = "";
const EMAIL_PORT = 465;
export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface BulkEmailData {
  subject: string;
  htmlContent?: string;
  textContent?: string;
  senderName?: string;
  senderEmail: string;
  recipients: EmailRecipient[];
  templateId?: number;
  params?: Record<string, any>;
  replyTo?: string;
  userId?: string;
}

class MessageService {
  private static formatNumber(num: string) {
    const cleaned = num.replace(/\D/g, ""); // remove non-digits
    if (cleaned.startsWith("0")) return "234" + cleaned.slice(1);
    if (cleaned.startsWith("234")) return cleaned;
    throw new Error(`Invalid phone number format: ${num}`);
  }

  // Validate numbers: must start with 234 and be 13 digits
  private static validateNumbers(recipients: string[]) {
    recipients.forEach((num) => {
      if (!/^234\d{10}$/.test(num)) {
        throw new Error(`Invalid phone number: ${num}`);
      }
    });
  }

  static async sendBulkSMS(
    recipients: string[],
    senderId: string,
    message: string
  ) {
    try {
      // Format and validate numbers
      const formattedRecipients = recipients.map(this.formatNumber);
      this.validateNumbers(formattedRecipients);

      console.log("Sending SMS to:", formattedRecipients);

      const response = await axios.post(TERMII_BASE_URL, {
        api_key: TERMII_API_KEY,
        to: formattedRecipients.join(","),
        from: senderId,
        sms: message,
        type: "plain",
        channel: "generic",
      });

      return ApiSuccess.ok("SMS sent successfully", response.data);
    } catch (error: any) {
      throw ApiError.badRequest(error.response?.data || error.message);
    }
  }

  // static async sendBulkEmail(emailData: BulkEmailData) {
  //   try {
  //     if (!BREVO_API_KEY) {
  //       throw new Error(
  //         "BREVO_API_KEY is not configured in environment variables"
  //       );
  //     }

  //     const {
  //       subject,
  //       htmlContent,
  //       textContent,
  //       senderName,
  //       senderEmail,
  //       recipients,
  //       templateId,
  //       params,
  //       replyTo,
  //       userId,
  //     } = emailData;

  //     // Prepare email data for Brevo
  //     const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  //     // Sender information
  //     sendSmtpEmail.sender = {
  //       name: senderName || "MyChurch",
  //       email: senderEmail,
  //     };

  //     // Reply-to if specified
  //     if (replyTo) {
  //       sendSmtpEmail.replyTo = {
  //         email: replyTo,
  //         name: senderName || "MyChurch",
  //       };
  //     }

  //     // Recipients
  //     sendSmtpEmail.to = recipients.map((recipient) => ({
  //       email: recipient.email,
  //       name: recipient.name || recipient.email,
  //     }));

  //     // Email subject
  //     sendSmtpEmail.subject = subject;

  //     // Content (template or direct content)
  //     if (templateId) {
  //       sendSmtpEmail.templateId = templateId;
  //       if (params) {
  //         sendSmtpEmail.params = params;
  //       }
  //     } else {
  //       if (htmlContent) {
  //         sendSmtpEmail.htmlContent = htmlContent;
  //       }
  //       if (textContent) {
  //         sendSmtpEmail.textContent = textContent;
  //       }
  //     }

  //     // Tags for tracking
  //     sendSmtpEmail.tags = ["bulk-email", "church-communication"];

  //     // Send the email
  //     const result = await brevoApiInstance.sendTransacEmail(sendSmtpEmail);

  //     return ApiSuccess.ok("Bulk email sent successfully", {
  //       messageId: result.messageId,
  //       recipientCount: recipients.length,
  //       userId: userId,
  //     });
  //   } catch (error: any) {
  //     console.error("Brevo API Error:", error);
  //     throw ApiError.badRequest(
  //       error.response?.data?.message ||
  //         error.message ||
  //         "Failed to send bulk email"
  //     );
  //   }
  // }

  static async sendBulkEmail(emailData: BulkEmailData) {
    try {
      if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
        throw new Error(
          "SMTP credentials are not configured in environment variables"
        );
      }

      const {
        subject,
        htmlContent,
        textContent,
        senderName,
        senderEmail,
        recipients,
        replyTo,
        userId,
      } = emailData;

      // Configure transporter
      const transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: true, // true for port 465, false otherwise
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });

      // Prepare email options
      const mailOptions = {
        from: `"${senderName || "MyChurch"}" <${senderEmail}>`,
        to: recipients
          .map((r) => `"${r.name || r.email}" <${r.email}>`)
          .join(", "),
        subject: subject,
        text: textContent,
        html: htmlContent,
        replyTo: replyTo,
      };

      // Send email
      const result = await transporter.sendMail(mailOptions);

      return ApiSuccess.ok("Bulk email sent successfully", {
        messageId: result.messageId,
        recipientCount: recipients.length,
        userId: userId,
      });
    } catch (error: any) {
      console.error("Nodemailer Error:", error);
      throw ApiError.badRequest(error.message || "Failed to send bulk email");
    }
  }
}

export default MessageService;
