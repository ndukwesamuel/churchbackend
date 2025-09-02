import type { ObjectId } from "mongoose";
import { ApiError } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import type { RegisterDTO } from "../auth/auth.interface";
import type { IUser } from "./user.interface";
import User from "./user.model";
import churchModel from "../church/church.model";
import type { IChurch } from "../church/church.interface";

class UserService {
  // static async createUser(userData: RegisterDTO): Promise<IUser> {
  //   const { password, email, phoneNumber, userName, lastName } = userData;

  //   const hashedPassword = await hashPassword(password);

  //   const user = new User({
  //     userName,
  //     lastName,
  //     phoneNumber,
  //     email,
  //     password: hashedPassword,
  //   });

  //   await user.save();

  //   return user;
  // }
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

export default UserService;
