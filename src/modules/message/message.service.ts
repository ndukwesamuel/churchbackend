import MessageModel from "./message.model";
import ContactModel from "../contacts/contacts.model";
import { ApiSuccess, ApiError } from "../../utils/responseHandler";
import type { ObjectId } from "mongoose";
import { AgendaScheduler } from "../scheduler/agenda.scheduler";
import { MessageProvider } from "./message.provider";
import type { IMessage } from "./message.interface";
import MessageSender from "../messgaing/message.service";

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
  static async createMessage(data: any, userId: ObjectId) {
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
          return await MessageSender.sendBulkEmail(emailPayload);

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

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value
    ).length;
    const failCount = results.length - successCount;
    const finalStatus = failCount > 0 ? "failed" : "sent";

    // Update DB
    message.status = finalStatus;
    message.sentAt = new Date();
    await message.save();

    return { successCount, failCount, status: finalStatus };
  }
  static async resolveContacts(groupIds: string[]) {
    return ContactModel.find({
      group: { $in: groupIds },
      status: "active",
    }).lean();
  }
  static async getMessages() {
    const messages = await MessageModel.find().populate("recipients");
    return ApiSuccess.ok("Messages fetched successfully", { messages });
  }

  static async getMessageById(id: string) {
    const message = await MessageModel.findById(id).populate("recipients");
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
