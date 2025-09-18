import type { Document, ObjectId } from "mongoose";

export interface IMessage extends Document {
  _id: ObjectId | string;
  message: string;
  messageType?: "sms" | "whatsapp" | "email";
  recipients: ObjectId[]; // group ids of the recipients
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduleAt?: Date;
  sentAt?: Date;
  createdBy: ObjectId; // reference to User
  description?: string;
  totalRecipients: number;
  totalCost: number;
}
