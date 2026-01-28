// models/eventRegistration.model.ts
import mongoose, { Schema } from "mongoose";
import type { IEventRegistration } from "./eventRegistration.interface";

const EventRegistrationSchema: Schema<IEventRegistration> = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true,
    },
    churchId: {
      type: Schema.Types.ObjectId,
      ref: "Church",
      required: [true, "Church ID is required"],
      index: true,
    },
    responses: {
      type: Schema.Types.Mixed,
      required: [true, "Form responses are required"],
    },
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: "Member",
    },
    registrantEmail: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    registrantName: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "attended"],
      default: "confirmed",
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for queries
EventRegistrationSchema.index({ eventId: 1, churchId: 1, status: 1 });
EventRegistrationSchema.index({ eventId: 1, registrantEmail: 1 });

export default mongoose.model<IEventRegistration>(
  "EventRegistration",
  EventRegistrationSchema,
);
