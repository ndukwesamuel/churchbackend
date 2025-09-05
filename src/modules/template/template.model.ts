import mongoose, { Schema } from "mongoose";
import type { ITemplate } from "./template.interface";

const templateSchema = new Schema<ITemplate>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Church",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    channels: [
      {
        type: String,
        enum: ["email", "whatsapp", "sms"],
        required: true,
      },
    ],

    content: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      required: false,
    },
    variables: {
      type: [String],
    },
  },
  {
    timestamps: true,
  }
);

export const Template = mongoose.model("Template", templateSchema);
