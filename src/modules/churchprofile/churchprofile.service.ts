import type { ObjectId } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import type { RegisterDTO } from "../auth/auth.interface";
import type { IUserProfile } from "./churchprofile.interface";
import churchModel from "../church/church.model";
import churchprofileModel from "./churchprofile.model";
// import type { IUser } from "./churchprofile.interface";
// import User from "./user.model";

class ChurchProfileService {
  static async getChurchProfile(userId: ObjectId) {
    const user = await ChurchProfileService.findChurchById(userId);
    return ApiSuccess.ok("User Retrieved Successfully", {
      user,
    });
  }

  static async createChurchGroup(userId: ObjectId, groupData: any) {
    const churchProfile = await ChurchProfileService.findChurchById(userId);

    if (
      ChurchProfileService.isDuplicateGroupName(
        churchProfile.groups,
        groupData.name
      )
    ) {
      throw ApiError.badRequest("Group name already exists in this church");
    }

    // Push the new group into the groups array
    churchProfile.groups.push({
      name: groupData.name,
      description: groupData.description,
    });

    await churchProfile.save();
    return ApiSuccess.ok("User Retrieved Successfully", {
      groups: churchProfile.groups,
    });
  }
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
  // static async findUserByEmail(email: string): Promise<IUser> {
  //   const user = await User.findOne({ email });
  //   if (!user) {
  //     throw ApiError.notFound("No user with this email");
  //   }
  //   return user;
  // }
  // static async findUserById(userId: ObjectId): Promise<IUser> {
  //   const user = await User.findById(userId);
  //   if (!user) {
  //     throw ApiError.notFound("User Not Found");
  //   }
  //   return user;
  // }
  // static async isDuplicateGroupName(email: string): Promise<void> {
  //   const user = await User.findOne({ email });

  //   if (user) {
  //     throw ApiError.badRequest("User with this email exists");
  //   }
  // }

  static isDuplicateGroupName(
    groups: { name: string }[],
    name: string
  ): boolean {
    if (!groups || !Array.isArray(groups)) return false;
    return groups.some(
      (g) => g.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
  }

  static async findChurchById(userId: ObjectId): Promise<IUserProfile> {
    const user = await churchprofileModel
      .findOne({ user: userId })
      .populate("user");
    if (!user) {
      throw ApiError.notFound("User Not Found");
    }
    return user;
  }
}

export default ChurchProfileService;
