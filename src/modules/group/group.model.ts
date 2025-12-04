import mongoose, { Schema, Types } from "mongoose";
import type { IGroup } from "./group.interface";

const GroupSchema: Schema<IGroup> = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    // **NEW FIELD:** Links the group to the Church that created it
    owner: {
      type: Types.ObjectId, // Data type for MongoDB IDs
      ref: "Church", // Name of the referenced model
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IGroup>("Group", GroupSchema);
