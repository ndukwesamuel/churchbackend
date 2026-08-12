// models/eventRegistration.interface.ts
import mongoose, { Document } from "mongoose";

export interface ICheckInEvent {
  action: "in" | "out";
  timestamp: Date;
}

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

  // Check-in / check-out tracking (QR scan toggles this)
  checkedIn: boolean;
  checkInHistory: ICheckInEvent[];

  // Metadata
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
