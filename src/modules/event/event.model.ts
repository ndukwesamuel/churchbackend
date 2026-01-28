// models/event.model.ts
import mongoose, { Schema } from "mongoose";
import type { IEvent, IFormField } from "./event.interface";

const FormFieldSchema = new Schema<IFormField>(
  {
    fieldId: {
      type: String,
      required: true,
    },
    fieldType: {
      type: String,
      enum: [
        "text",
        "email",
        "phone",
        "number",
        "select",
        "checkbox",
        "date",
        "textarea",
        "radio",
      ],
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    placeholder: {
      type: String,
      trim: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: {
      type: [String],
      default: undefined,
    },
    validation: {
      min: Number,
      max: Number,
      pattern: String,
      minLength: Number,
      maxLength: Number,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const EventSchema: Schema<IEvent> = new Schema(
  {
    churchId: {
      type: Schema.Types.ObjectId,
      ref: "Church",
      required: [true, "Church ID is required"],
      index: true,
    },
    eventName: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, "Event date is required"],
    },
    eventEndDate: {
      type: Date,
    },
    location: {
      type: String,
      trim: true,
    },
    capacity: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "open", "closed"],
      default: "draft",
    },
    formFields: {
      type: [FormFieldSchema],
      required: true,
      validate: {
        validator: function (fields: IFormField[]) {
          return fields.length > 0;
        },
        message: "At least one form field is required",
      },
    },
    allowMultipleRegistrations: {
      type: Boolean,
      default: false,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    registrationCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Index for queries
EventSchema.index({ churchId: 1, status: 1, eventDate: -1 });

export default mongoose.model<IEvent>("Event", EventSchema);
