import MessageModel from "./message.model";
import ContactModel from "../contacts/contacts.model";
import { ApiSuccess, ApiError } from "../../utils/responseHandler";
import { Types } from "mongoose";
import { AgendaScheduler } from "../scheduler/agenda.scheduler";
import { MessageProvider } from "./message.provider";
import type { IMessage } from "./message.interface";
import MessageSender from "../messgaing/message.service";
import { sendBulkEmail_Brevo } from "../../utils/email";

const COST_PER_TYPE: Record<string, number> = {
  sms: 3,
  whatsapp: 3,
  email: 2,
};

function dedupeContacts(contacts: any[]) {
  const seen = new Map<string, any>();
  for (const c of contacts) {
    const key = c.phoneNumber || c.email || c._id.toString();
    if (!seen.has(key)) seen.set(key, c);
  }
  return Array.from(seen.values());
}

export class MessageService {
  static async createMessage(data: any, userId: Types.ObjectId) {
    const rawContacts = await this.resolveContacts(data.recipients);
    const contacts = dedupeContacts(rawContacts);
    const totalRecipients = contacts.length;
    const totalCost = totalRecipients * (COST_PER_TYPE[data.messageType] ?? 0);

    const basePayload: Partial<IMessage> = {
      ...data,
      createdBy: userId,
      totalRecipients,
      totalCost,
    };

    // Draft
    if (data.status === "draft") {
      const message = await MessageModel.create({
        ...basePayload,
        status: "draft",
      });
      return ApiSuccess.ok("Message saved as draft", { message });
    }

    // Scheduled
    if (data.status === "scheduled") {
      const message = await MessageModel.create({
        ...basePayload,
        status: "scheduled",
      });
      await AgendaScheduler.scheduleJob(
        message._id.toString(),
        data.scheduleAt
      );
      return ApiSuccess.ok("Message scheduled successfully", { message });
    }

    // Sent
    if (data.status === "sent") {
      // Create DB record first
      const message = await MessageModel.create({
        ...basePayload,
        status: "sent",
        sentAt: new Date(),
      });
      const payload = {
        to: contacts.map((c) => c.phoneNumber),
        sms: data.message,
      };

      const emailPayload = {
        from: "",
        to: contacts.map((c) => c.email),
        subject: "Email subject",
        html: data.message,
      };
      // console.log(emailPayload);
      // Directly delegate to the right provider
      switch (data.messageType) {
        case "sms":
          return await MessageSender.sendBulkSMSV2(payload);

        case "email":
          console.log({
            gyuuu: emailPayload,
          });
          const emailSubject = emailPayload.subject;
          const emailHtml = emailPayload.html;
          const emailText = emailPayload.html;
          const recipients = emailPayload.to;

          // const emailHtml =
          //   "<h1>This is a bulk test email</h1><p>Bulk email is working!</p>";

          // const recipients = [
          //   "kenechukwuokoh30@gmail.com",
          //   "ndukwesamuel23@gmail.com",
          //   // Add more emails as needed
          // ];

          const result = await sendBulkEmail_Brevo({
            to: recipients,
            subject: emailSubject,
            text: emailText,
            html: emailHtml,
          });

          console.log({
            gyy: result,
            xxxx: result.results,
          });

          return result;

        // return await MessageSender.sendBulkEmail(emailPayload);
        // return await MessageSender.sendBulkEmail_Brevo(emailPayload);

        // const emailData: BulkEmailData = {
        //   subject: data.subject,
        //   htmlContent: data.message, // assuming message is HTML body
        //   textContent: data.textContent || data.message, // fallback
        //   senderName: data.senderName || "Elpis",
        //   senderEmail: data.senderEmail || "75e89f001@smtp-brevo.com",
        //   recipients: contacts.map((c) => ({
        //     name: c.fullName,
        //     email: c.email,
        //   })),
        //   replyTo: data.replyTo,
        //   userId,
        // };

        // return await MessageSender2.sendBulkEmail(emailData);
        case "whatsapp":
          return await MessageSender.sendBulkWhatsApp(payload);

        default:
          throw ApiError.badRequest("Unsupported message type");
      }
    }

    throw ApiError.badRequest("Invalid status");
  }

  static async sendScheduledMessage(messageId: string) {
    const message = await MessageModel.findById(messageId);
    if (!message) throw ApiError.notFound("Scheduled message not found");

    // Skip if already sent or failed
    if (["sent", "failed"].includes(message.status)) {
      return { skipped: true };
    }

    // Load contacts from groups
    const contacts = await ContactModel.find({
      group: { $in: message.recipients },
      status: "active",
    }).lean();
    const deduped = Array.from(
      new Map(contacts.map((c) => [c.phoneNumber || c.email, c])).values()
    );

    // Deliver
    const results = await Promise.allSettled(
      deduped.map((c) => {
        switch (message.messageType) {
          case "sms":
            return MessageProvider.sendSms(c, message.message);
          case "whatsapp":
            return MessageProvider.sendWhatsapp(c, message.message);
          case "email":
            return MessageProvider.sendEmail(c, message.message);
          default:
            return Promise.resolve(false);
        }
      })
    );
    console.log({ results });
    // const successCount = results.filter(
    //   (r) => r.status === "fulfilled" && r.value
    // ).length;
    // const failCount = results.length - successCount;
    // const finalStatus = failCount > 0 ? "failed" : "sent";

    // // Update DB
    // message.status = finalStatus;
    // message.sentAt = new Date();
    // await message.save();
    return { message: "message sent" };
    // return { successCount, failCount, status: finalStatus };
  }
  static async resolveContacts(groupIds: string[]) {
    return ContactModel.find({
      group: { $in: groupIds },
      status: "active",
    }).lean();
  }
  static async getMessages(userId: Types.ObjectId) {
    const messages = await MessageModel.find({ createdBy: userId }).populate(
      "recipients"
    );
    return ApiSuccess.ok("Messages fetched successfully", { messages });
  }

  // Option 2: Filter by status = "scheduled"
  static async getScheduledMessages(userId: Types.ObjectId) {
    const messages = await MessageModel.find({
      // createdBy: userId,
      status: "scheduled",
    }).populate("recipients");

    console.log({
      gggg: messages[0],
      gggg2: messages[0].recipients,
    });

    return ApiSuccess.ok("Scheduled messages fetched successfully", {
      messages,
    });
  }

  // static async sendScheduledMessages() {
  //   const now = new Date();

  //   // Get start and end of today (ignore time, just date)
  //   const startOfToday = new Date(
  //     now.getFullYear(),
  //     now.getMonth(),
  //     now.getDate(),
  //     0,
  //     0,
  //     0
  //   );
  //   const endOfToday = new Date(
  //     now.getFullYear(),
  //     now.getMonth(),
  //     now.getDate(),
  //     23,
  //     59,
  //     59
  //   );

  //   // Get all scheduled messages for today
  //   const messages = await MessageModel.find({
  //     status: "scheduled",
  //     scheduleAt: {
  //       $gte: startOfToday, // From start of today
  //       $lte: endOfToday, // To end of today
  //     },
  //   }).populate("recipients");

  //   const results = [];

  //   for (const message of messages) {
  //     // Get all contacts in those groups that belong to THIS user (multi-tenant isolation)
  //     const contacts = await ContactModel.find({
  //       user: message.createdBy,
  //       group: { $in: message.recipients },
  //     });

  //     // Extract phone numbers/emails based on message type
  //     let recipients: string[] = [];

  //     if (message.messageType === "sms" || message.messageType === "whatsapp") {
  //       recipients = contacts.map((contact) => contact.phoneNumber);
  //     } else if (message.messageType === "email") {
  //       recipients = contacts
  //         .map((contact) => contact.email)
  //         .filter((email) => email);
  //     }

  //     const messageText = message.message;

  //     // Send the message
  //     // await yourSmsService.send(recipients, messageText);

  //     // Update message status
  //     // message.status = "sent";
  //     // message.sentAt = new Date();
  //     // await message.save();

  //     results.push({
  //       userId: message.createdBy,
  //       messageId: message._id,
  //       recipients,
  //       messageText,
  //     });
  //   }

  //   console.log({
  //     tyuu: results,
  //   });

  //   return results;
  // }

  static async sendScheduledMessages() {
    const now = new Date();

    // Get start and end of today (ignore time, just date)
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    // Get all scheduled messages for today
    const messages = await MessageModel.find({
      status: "scheduled",
      scheduleAt: {
        $gte: startOfToday,
        $lte: endOfToday,
      },
    }).populate("recipients");

    const results = [];

    for (const message of messages) {
      // Get all contacts in those groups that belong to THIS user (multi-tenant isolation)
      const contacts = await ContactModel.find({
        user: message.createdBy,
        group: { $in: message.recipients },
      });

      // Extract phone numbers/emails based on message type
      let recipients: string[] = [];

      if (message.messageType === "sms" || message.messageType === "whatsapp") {
        recipients = contacts.map((contact) => contact.phoneNumber);
      } else if (message.messageType === "email") {
        recipients = contacts
          .map((contact) => contact.email)
          .filter((email) => email);
      }

      const messageText = message.message;

      try {
        // Send the message based on type
        if (message.messageType === "sms") {
          const smsPayload = {
            to: recipients,
            sms: messageText,
          };
          await MessageSender.sendBulkSMSV2(smsPayload);
        }
        // Add whatsapp and email handlers here if needed
        // else if (message.messageType === "whatsapp") { ... }
        // else if (message.messageType === "email") { ... }

        // Update message status to sent
        message.status = "sent";
        message.sentAt = new Date();
        await message.save();

        results.push({
          userId: message.createdBy,
          messageId: message._id,
          recipients,
          messageText,
          status: "sent",
          success: true,
        });
      } catch (error) {
        // If sending fails, mark as failed
        message.status = "failed";
        await message.save();

        results.push({
          userId: message.createdBy,
          messageId: message._id,
          recipients,
          messageText,
          status: "failed",
          success: false,
          error: error.message,
        });
      }
    }

    console.log({
      scheduledMessagesSent: results,
    });

    return results;
  }

  static async getMessageById(id: string, userId: Types.ObjectId) {
    const message = await MessageModel.findOne({
      _id: id,
      createdBy: userId,
    }).populate("recipients");
    return ApiSuccess.ok("Message fetched successfully", { message });
  }

  static async updateMessage(id: string, data: any) {
    const message = await MessageModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    return ApiSuccess.ok("Message updated successfully", { message });
  }

  static async deleteMessage(id: string) {
    await MessageModel.findByIdAndDelete(id);
    return ApiSuccess.ok("Message deleted successfully", {});
  }
}
