import { Schema, model } from "mongoose";
import type { IMessage } from "./message.interface";

const MessageSchema = new Schema<IMessage>(
  {
    message: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["sms", "whatsapp", "email"],
      required: true,
    },
    recipients: [{ type: Schema.Types.ObjectId, ref: "Group" }],
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "failed"],
      default: "draft",
    },
    scheduleAt: { type: Date },
    sentAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String },
    totalRecipients: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export default model<IMessage>("Messages", MessageSchema);
