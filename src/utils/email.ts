// import nodemailer from "nodemailer";
// import { env } from "../config/env.config";
// // import { env } from "../../config/env.config";

// interface SendEmailParams {
//   to: string;
//   subject: string;
//   text?: string;
//   html?: string;
//   from?: string;
// }

// const sendEmail = async ({
//   to,
//   subject,
//   text,
//   html,
//   from,
// }: SendEmailParams) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: "smtp-relay.brevo.com",
//       port: 465,
//       secure: true,
//       auth: {
//         user: env.BREVO_EMAIL,
//         pass: env.BREVO_PASSWORD,
//       },
//       tls: {
//         rejectUnauthorized: false,
//       },
//     });

//     const mailOptions = {
//       from: from || "church <ndukwesamuel23@gmail.com>",
//       to: to,
//       subject,
//       text,
//       html,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     console.log("Email sent:", info.response);
//     return info;
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw error;
//   }
// };

// export default sendEmail;

// email.utils.ts
import nodemailer from "nodemailer";
import { env } from "../config/env.config";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

interface SendBulkEmailParams {
  to: string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  batchSize?: number; // Number of emails to send per batch
}

const sendEmail = async ({
  to,
  subject,
  text,
  html,
  from,
}: SendEmailParams) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 465,
      secure: true,
      auth: {
        user: env.BREVO_EMAIL,
        pass: env.BREVO_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: from || "church <ndukwesamuel23@gmail.com>",
      to: Array.isArray(to) ? to.join(", ") : to, // Handle array or string
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

// New function for bulk email with batching
const sendBulkEmail_Brevo = async ({
  to,
  subject,
  text,
  html,
  from,
  batchSize = 50, // Brevo allows up to 50 recipients per email
}: SendBulkEmailParams) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp-relay.brevo.com",
      port: 465,
      secure: true,
      auth: {
        user: env.BREVO_EMAIL,
        pass: env.BREVO_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const results = [];
    const errors = [];

    // Split recipients into batches
    for (let i = 0; i < to.length; i += batchSize) {
      const batch = to.slice(i, i + batchSize);

      try {
        const mailOptions = {
          from: from || "church <ndukwesamuel23@gmail.com>",
          to: batch.join(", "),
          subject,
          text,
          html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(
          `Batch ${Math.floor(i / batchSize) + 1} sent:`,
          info.response
        );

        results.push({
          batch: Math.floor(i / batchSize) + 1,
          recipients: batch.length,
          messageId: info.messageId,
          response: info.response,
        });

        // Add a small delay between batches to avoid rate limiting
        if (i + batchSize < to.length) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
        }
      } catch (error: any) {
        console.error(
          `Error sending batch ${Math.floor(i / batchSize) + 1}:`,
          error
        );
        errors.push({
          batch: Math.floor(i / batchSize) + 1,
          recipients: batch,
          error: error.message,
        });
      }
    }

    return {
      success: results.length > 0,
      totalRecipients: to.length,
      successfulBatches: results.length,
      failedBatches: errors.length,
      results,
      errors,
    };
  } catch (error) {
    console.error("Error in bulk email sending:", error);
    throw error;
  }
};

export { sendEmail, sendBulkEmail_Brevo };
export default sendEmail;
