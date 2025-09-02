import type { Document, ObjectId } from "mongoose";

// export type UserRolesEnum = ("user" | "admin")[];

export interface IChurch extends Document {
  churchName: string;
  pastorName: string;
  churchType: string;
  fullName: string;
  email: string;
  password: string | undefined;
  isActive: boolean;
  isVerified: boolean;
}

// export interface AuthenticatedUser {
//   userId: ObjectId;
//   roles: UserRolesEnum;
//   email?: string;
// }
