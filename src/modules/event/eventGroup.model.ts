// models/eventGroup.model.ts
import mongoose, { Schema } from "mongoose";
import type { IEventGroup } from "./eventGroup.interface";

const EventGroupSchema: Schema<IEventGroup> = new Schema(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true,
    },
    churchId: {
      type: Schema.Types.ObjectId,
      ref: "Church",
      required: [true, "Church ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
    },
    nextSequence: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

EventGroupSchema.index({ eventId: 1, churchId: 1 });
// One group name per event — avoids two groups both called "Group 1".
EventGroupSchema.index({ eventId: 1, name: 1 }, { unique: true });

export default mongoose.model<IEventGroup>("EventGroup", EventGroupSchema);
