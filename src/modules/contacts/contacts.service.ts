import type { ObjectId } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import type { RegisterDTO } from "../auth/auth.interface";
// import type { IUserProfile } from "./churchprofile.interface";
import churchModel from "../church/church.model";

import contactsModel from "./contacts.model";
import type { IContacts } from "./contacts.interface";
// import type { IUser } from "./churchprofile.interface";
// import User from "./user.model";

class ContactsService {
  static async getChurchContact(userId: ObjectId) {
    const user = await ContactsService.findALLChurchMembersContact(userId);
    return ApiSuccess.ok("Church Member Retrieved Successfully", {
      memberCount: user.length,
      members: user,
    });
  }

  static async createContact(userId: ObjectId, contactData: any) {
    const contactPayload: any = {
      user: userId,
      fullName: contactData.fullName,
      email: contactData.email,
      phoneNumber: contactData.phoneNumber,
    };

    if (contactData.groupId) {
      contactPayload.group = contactData.groupId; // ✅ only set if valid
    }

    const contact = await contactsModel.create(contactPayload);

    return ApiSuccess.ok("Contact created successfully", { contact });
  }
  // ✅ Delete all contacts
  static async deleteAllContacts() {
    await contactsModel.deleteMany({});
    return ApiSuccess.ok("All contacts deleted successfully", {});
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

  // static isDuplicateGroupName(
  //   groups: { name: string }[],
  //   name: string
  // ): boolean {
  //   if (!groups || !Array.isArray(groups)) return false;
  //   return groups.some(
  //     (g) => g.name.trim().toLowerCase() === name.trim().toLowerCase()
  //   );
  // }

  static async findALLChurchMembersContact(
    userId: ObjectId
  ): Promise<IContacts[]> {
    return await contactsModel
      .find({ user: userId })
      .populate("user", "churchName pastorName email");
  }
}

export default ContactsService;
