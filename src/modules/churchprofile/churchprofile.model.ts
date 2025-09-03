import mongoose, { Schema } from "mongoose";
import type { IUserProfile } from "./churchprofile.interface";

const GroupSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    description: { type: String, trim: true },
  },
  { _id: true } // ensures each group has an ObjectId
);

const ChurchProfileSchema: Schema<IUserProfile> = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Church",
      required: true,
      unique: true,
    },
    memberCount: {
      type: Number,
      default: 0,
    },
    groups: [GroupSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUserProfile>(
  "ChurchProfile",
  ChurchProfileSchema
);
