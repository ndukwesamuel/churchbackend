// import fs from "fs";
// import handlebars from "handlebars";
// import type { SendMailOptions, SentMessageInfo, Transporter } from "nodemailer";
// import path from "path";
// import { env } from "../../config/env.config.js";
// import transporter from "../../lib/transporter.js";

// import logger from "../../utils/logger";
// export class MailService {
//   private transporter: Transporter;

//   constructor() {
//     this.transporter = transporter;
//   }

//   private static loadTemplate(templateName: string, data: object): string {
//     const templatePath = path.join(
//       __dirname,
//       "..",
//       "templates",
//       `${templateName}.html`
//     );
//     const templateSource = fs.readFileSync(templatePath, "utf8");
//     const compiledTemplate = handlebars.compile(templateSource);
//     return compiledTemplate(data);
//   }

//   public async sendEmail({
//     to,
//     subject,
//     text,
//     html,
//     from,
//   }: SendMailOptions): Promise<SentMessageInfo> {
//     try {
//       const mailOptions = {
//         from: from || env.EMAIL_SENDER || "ChurchEvent <info@churhcevent.com>",
//         replyTo: env.ADMIN_EMAIL,
//         to,
//         subject,
//         text,
//         html,
//       };

//       const info = await this.transporter.sendMail(mailOptions);
//       return info;
//     } catch (error) {
//       logger.fatal("Error sending email:", error);
//       throw error;
//     }
//   }
// }
