// import type { Document, ObjectId } from "mongoose";
// import type { IGroup } from "../group/group.interface";

// export interface IContacts extends Document {
//   user: ObjectId; // references the Church
//   fullName: string;
//   group?: ObjectId | IGroup | null; // 👈 allow populated object
//   email?: string;
//   phoneNumber: string;
//   createdAt: Date;
//   updatedAt: Date;
//   status: "active" | "inactive" | "pending";
// }

import { Types } from "mongoose";

export interface IContacts {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  fullName: string;
  group?: Types.ObjectId;
  email?: string;
  status: "active" | "inactive" | "pending";
  phoneNumber: string;
  birthDay?: string;
  birthMonth?: string;
  role: "Member" | "Leader";
  createdAt: Date;
  updatedAt: Date;
}
