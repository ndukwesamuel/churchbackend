// models/eventGroup.interface.ts
import mongoose, { Document } from "mongoose";

export interface IEventGroup extends Document {
  eventId: mongoose.Types.ObjectId;
  churchId: mongoose.Types.ObjectId;
  name: string;

  // Next tag sequence number to hand out when a person is assigned to this
  // group (e.g. group "Samheart" -> tags S01, S02, ...). Increments on every
  // assignment and is never reused, so tags stay unique even after someone
  // is removed from the group.
  nextSequence: number;

  createdAt: Date;
  updatedAt: Date;
}
