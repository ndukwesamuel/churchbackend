import type { ObjectId } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import churchprofileModel from "./contacts.model";
import contactsModel from "./contacts.model";
import type { IContacts } from "./contacts.interface";

class ContactsService {
  static async getChurchContact(userId: ObjectId) {
    const user = await ContactsService.findALLChurchMembersContact(userId);
    return ApiSuccess.ok("User Retrieved Successfully", {
      user,
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
      contactPayload.group = contactData.groupId;
    }

    const contact = await contactsModel.create(contactPayload);

    return ApiSuccess.ok("Contact created successfully", { contact });
  }
  static async deleteAllContacts() {
    await contactsModel.deleteMany({});
    return ApiSuccess.ok("All contacts deleted successfully", {});
  }

  static async findALLChurchMembersContact(
    userId: ObjectId
  ): Promise<IContacts> {
    const user = await churchprofileModel
      .findOne({ user: userId })
      .populate("user");
    // .populate("group");
    if (!user) {
      throw ApiError.notFound("User Not Found");
    }
    return user;
  }
}

export default ContactsService;
