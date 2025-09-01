import type { Document, ObjectId } from "mongoose";

// export type UserRolesEnum = ("user" | "admin")[];

export interface IChurch extends Document {
  churchName: string;
  pastorName: string;
  email: string;
  // phoneNumber: string;
  password: string | undefined;
  isActive: boolean;
  isVerified: boolean;
  // roles: UserRolesEnum;
}

// export interface AuthenticatedUser {
//   userId: ObjectId;
//   roles: UserRolesEnum;
//   email?: string;
// }
