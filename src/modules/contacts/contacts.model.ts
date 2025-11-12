import mongoose, { Schema } from "mongoose";
import type { IContacts } from "./contacts.interface";

const ContactSchema: Schema<IContacts> = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
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
      type: Schema.Types.ObjectId,
      ref: "Group",
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
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
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
    birthDay: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty (optional field)
          const day = parseInt(v);
          return day >= 1 && day <= 31;
        },
        message: "Birth day must be between 1 and 31",
      },
    },
    birthMonth: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow empty (optional field)
          const month = parseInt(v);
          return month >= 1 && month <= 12;
        },
        message: "Birth month must be between 1 and 12",
      },
    },
    role: {
      type: String,
      enum: ["Member", "Leader"],
      default: "Member",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field to get formatted birthday
ContactSchema.virtual("birthday").get(function () {
  if (!this.birthDay || !this.birthMonth) return null;

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return `${months[parseInt(this.birthMonth) - 1]} ${this.birthDay}`;
});

// Index for birthday queries (useful for birthday notifications)
ContactSchema.index({ birthMonth: 1, birthDay: 1 });

export default mongoose.model<IContacts>("Contact", ContactSchema);
