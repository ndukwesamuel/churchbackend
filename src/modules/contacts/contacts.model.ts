import mongoose, { Schema } from "mongoose";
import type { IContacts } from "./contacts.interface";

const ContactSchema: Schema<IContacts> = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Church",
      required: true,
      index: true, // <-- keep for faster lookup, but not unique
    },
    fullName: {
      type: String,
      trim: true,
      required: [true, "Please provide a username"],
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChurchProfile.groups", // subdocument reference
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        "Please provide a valid email address",
      ],
    },
    phoneNumber: {
      type: String,
      required: [true, "Please provide a phone number"],
      trim: true,
      match: [
        /^\+?[1-9]\d{1,14}$/,
        "Please enter a valid phone number (E.164 format)",
      ],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IContacts>("Contact", ContactSchema);
