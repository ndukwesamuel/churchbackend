import type { Document, ObjectId } from "mongoose";
import type { IGroup } from "../group/group.interface";

export interface IContacts extends Document {
  user: ObjectId; // references the Church
  fullName: string;
  group?: ObjectId | IGroup | null; // 👈 allow populated object
  email?: string;
  phoneNumber: string;
  createdAt: Date;
  updatedAt: Date;
  status: "active" | "inactive" | "pending";
}
