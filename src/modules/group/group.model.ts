import mongoose, { Schema } from "mongoose";
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
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IGroup>("Group", GroupSchema);
