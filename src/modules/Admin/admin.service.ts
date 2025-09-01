import type { ObjectId } from "mongoose";
import { ApiError } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import type { RegisterDTO } from "../auth/auth.interface";
import type { IUser } from "./user.interface";
import churchModel from "../church/church.model";
import type { IChurch } from "../church/church.interface";
import userModel from "../user/user.model";

class AdminserService {
  static async createAdmiinUser(userData: RegisterDTO): Promise<IUser> {
    const { fullName, email, password } = userData;

    if (!fullName || !email || !password) {
      throw ApiError.notFound("All fields are required");
    }

    // // check if user already exists
    // const existingUser = await userModel.findOne({ email });
    // if (existingUser) {
    //   throw ApiError.notFound("User already exists with this email");
    // }
    // const hashedPassword = await hashPassword(password);

    // create admin user
    // const adminUser = await userModel.create({
    //   fullName,
    //   email,
    //   password: hashedPassword,
    //   roles: ["admin"], // set role as admin
    //   isVerified: true,
    // });
    // await adminUser.save();

    const adminUser = await userModel.find();

    return adminUser;
  }

  static async findUserByEmail(email: string): Promise<IUser> {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw ApiError.notFound("No user with this email");
    }
    return user;
  }
  static async findUserById(userId: ObjectId): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound("User Not Found");
    }

    return user;
  }
  static async checkIfUserExists(email: string): Promise<void> {
    const user = await User.findOne({ email });

    if (user) {
      throw ApiError.badRequest("User with this email exists");
    }
  }

  static async checkIfChurchExists(email: string): Promise<void> {
    const church = await churchModel.findOne({ email });

    if (church) {
      throw ApiError.badRequest("Church with this email exists");
    }
  }

  static async findChurchByEmail(email: string): Promise<IChurch> {
    const user = await churchModel.findOne({ email }).select("+password");
    if (!user) {
      throw ApiError.notFound("No user with this email");
    }
    return user;
  }
}

export default AdminserService;
