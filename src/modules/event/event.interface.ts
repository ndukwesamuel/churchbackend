// models/event.interface.ts
import mongoose, { Document } from "mongoose";

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "select"
  | "checkbox"
  | "date"
  | "textarea"
  | "radio";

export interface IFormField {
  fieldId: string;
  fieldType: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select, checkbox, radio
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  order: number;
}

export interface IEvent extends Document {
  churchId: mongoose.Types.ObjectId;
  eventName: string;
  description?: string;
  eventDate: Date;
  eventEndDate?: Date;
  location?: string;
  capacity?: number;
  status: "draft" | "open" | "closed";

  // Dynamic form configuration
  formFields: IFormField[];

  // Settings
  allowMultipleRegistrations: boolean;
  requireApproval: boolean;
  isPublic: boolean; // allow non-members to register

  // Metadata
  createdBy: mongoose.Types.ObjectId;
  registrationCount: number;

  createdAt: Date;
  updatedAt: Date;
}
