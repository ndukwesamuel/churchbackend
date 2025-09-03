import type { Document, ObjectId } from "mongoose";

export type UserRolesEnum = ("user" | "admin")[];

export interface IUserProfile extends Document {
  // fullName: string;
  // lastName: string;
  // email: string;
  memberCount: number;
  phoneNumber: string;
  groups: {
    name: string;
    description?: string;
    // leader?: ObjectId;
    // members?: ObjectId[];
  }[];
  // password: string | undefined;
  // isActive: boolean;
  // isVerified: boolean;
  // roles: UserRolesEnum;
  user: ObjectId;
}

export interface AuthenticatedUser {
  userId: ObjectId;
  roles: UserRolesEnum;
  email?: string;
}
