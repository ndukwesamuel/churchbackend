// models/eventRegistration.interface.ts
import mongoose, { Document } from "mongoose";

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;

  // Dynamic form responses
  responses: Record<string, any>;

  // Registrant info
  registeredBy?: mongoose.Types.ObjectId; // if member
  registrantEmail: string;
  registrantName: string;

  // Status
  status: "pending" | "confirmed" | "cancelled" | "attended";

  // Metadata
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
