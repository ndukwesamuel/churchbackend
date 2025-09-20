import type { Document, ObjectId } from "mongoose";

// export type UserRolesEnum = ("user" | "admin")[];

export interface IContacts extends Document {
  user: ObjectId; // references the Church
  fullName: string; // contact's full name
  group?: string; // optional group
  email?: string; // optional email
  phoneNumber: string; // required phone number
  createdAt: Date; // from timestamps
  updatedAt: Date; // from timestamps
  status: "active" | "inactive" | "pending"; // contact status
}

// export interface AuthenticatedUser {
//   userId: ObjectId;
//   roles: UserRolesEnum;
//   email?: string;
// }
