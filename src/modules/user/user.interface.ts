import type { Document, ObjectId } from "mongoose";
import { Types } from "mongoose";
export type UserRolesEnum = ("user" | "admin")[];

export interface IUser extends Document {
  fullName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string | undefined;
  isActive: boolean;
  isVerified: boolean;
  roles: UserRolesEnum;
}

export interface AuthenticatedUser {
  userId: Types.ObjectId;
  roles: UserRolesEnum;
  email?: string;
}
