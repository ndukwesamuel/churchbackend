import MessageModel from "./message.model";
import ContactModel from "../contacts/contacts.model";
import { ApiSuccess, ApiError } from "../../utils/responseHandler";
import type { ObjectId } from "mongoose";
import { AgendaScheduler } from "../scheduler/agenda.scheduler";
import { MessageProvider } from "./message.provider";
import type { IMessage } from "./message.interface";
const COST_PER_TYPE: Record<string, number> = {
  sms: 2,
  whatsapp: 1,
  email: 0.5,
};

function dedupeContacts(contacts: any[]) {
  const seen = new Map<string, any>();
  for (const c of contacts) {
    const key = c.phoneNumber || c.email || c._id.toString();
    if (!seen.has(key)) seen.set(key, c);
  }
  return Array.from(seen.values());
}

async function resolveContacts(groupIds: string[]) {
  return ContactModel.find({
    group: { $in: groupIds },
    status: "active",
  }).lean();
}
export class MessageService {
  static async createMessage(data: any, userId: ObjectId) {
    const rawContacts = await resolveContacts(data.recipients);
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

    // Immediate Send
    if (data.status === "sent") {
      const message = await MessageModel.create({
        ...basePayload,
        status: "sent",
        sentAt: new Date(),
      });

      const results = await Promise.allSettled(
        contacts.map((c) => {
          switch (data.messageType) {
            case "sms":
              return MessageProvider.sendSms(c, data.message);
            case "whatsapp":
              return MessageProvider.sendWhatsapp(c, data.message);
            case "email":
              return MessageProvider.sendEmail(c, data.message);
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

      const updated = await MessageModel.findByIdAndUpdate(
        message._id,
        { status: finalStatus, sentAt: new Date() },
        { new: true }
      );

      return ApiSuccess.ok("Message processed", {
        message: updated,
        sendSummary: { successCount, failCount },
      });
    }

    throw ApiError.badRequest("Invalid status");
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
