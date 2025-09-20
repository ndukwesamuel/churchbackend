import mongoose, { Schema } from "mongoose";
import type { IChannelConfig } from "./channelConfig.interface";
const ChannelConfigSchema = new Schema<IChannelConfig>(
  {
    emailProvider: {
      type: String,
      trim: true,
      required: [true, "Please provide an Email provider"],
    },
    fromEmail: {
      type: String,
      trim: true,
      required: [true, "Email required"],
    },
    apiKey: {
      type: String,
      required: [true, "Please provide an API key"],
      trim: true,
      unique: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IChannelConfig>(
  "ChannelConfig",
  ChannelConfigSchema
);
