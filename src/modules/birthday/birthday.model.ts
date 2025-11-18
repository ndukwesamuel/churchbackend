import mongoose, { Schema } from "mongoose";

export interface IBirthdayConfig {
  user: mongoose.Types.ObjectId;
  enabled: boolean;
  template: mongoose.Types.ObjectId; // Single template reference
  selectedChannels: ("email" | "whatsapp" | "sms")[]; // Which channels to use
  sendTime: string; // Format: "HH:MM" e.g., "08:00"
  createdAt: Date;
  updatedAt: Date;
}

const birthdayConfigSchema = new Schema<IBirthdayConfig>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Church",
      required: true,
      unique: true, // ✅ Changed to true - ONE config per user
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    template: {
      type: Schema.Types.ObjectId,
      ref: "Template",
      required: false, // Optional until user selects one
    },
    selectedChannels: [
      {
        type: String,
        enum: ["email", "whatsapp", "sms"],
      },
    ],
    sendTime: {
      type: String,
      default: "08:00",
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"],
    },
  },
  {
    timestamps: true,
  }
);

// Validation: selectedChannels must be subset of template's channels
birthdayConfigSchema.pre("save", async function (next) {
  if (this.isModified("template") || this.isModified("selectedChannels")) {
    if (this.template && this.selectedChannels.length > 0) {
      const Template = mongoose.model("Template");
      const template = await Template.findById(this.template);

      if (template) {
        // Check if selected channels are available in the template
        const invalidChannels = this.selectedChannels.filter(
          (channel) => !template.channels.includes(channel)
        );

        if (invalidChannels.length > 0) {
          throw new Error(
            `Template does not support channels: ${invalidChannels.join(", ")}`
          );
        }
      }
    }
  }
  next();
});

// ✅ REMOVED compound index - we only need the unique constraint on user
// birthdayConfigSchema.index({ user: 1, template: 1 }, { unique: true });

export const BirthdayConfig = mongoose.model<IBirthdayConfig>(
  "BirthdayConfig",
  birthdayConfigSchema
);
