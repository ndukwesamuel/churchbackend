import nodemailer from "nodemailer";
import { env } from "../config/env.config";
// import { env } from "../../config/env.config";

interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
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
      to: to,
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

export default sendEmail;
