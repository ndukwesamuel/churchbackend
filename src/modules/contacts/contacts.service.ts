import type { ObjectId } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import contactsModel from "./contacts.model";
import type { IContacts } from "./contacts.interface";
import type { IGroup } from "../group/group.interface";
class ContactsService {
  static async getChurchContact(userId: ObjectId) {
    const members = await this.findALLChurchMembersContact(userId);

    // Count members by group
    const groupCounts = members.reduce((acc, member) => {
      const group = member.group;

      // type guard: only count if it's a populated group
      if (group && typeof group !== "string" && "_id" in group) {
        const groupId = group._id.toString();
        if (!acc[groupId]) {
          acc[groupId] = {
            groupId,
            groupName: (group as IGroup).name,
            count: 0,
          };
        }
        acc[groupId].count += 1;
      }

      return acc;
    }, {} as Record<string, { groupId: string; groupName: string; count: number }>);

    return ApiSuccess.ok("Church Member Retrieved Successfully", {
      memberCount: members.length,
      members,
      groupCounts: Object.values(groupCounts),
      groupTotal: Object.keys(groupCounts).length,
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

  static async UpdateContact(userId: ObjectId, id: any, contactData: any) {
    const updatedContact = await contactsModel.findByIdAndUpdate(
      id,
      contactData,
      {
        new: true, // return updated doc
        runValidators: true, // apply schema validators
      }
    );
    if (!updatedContact) {
      throw ApiError.notFound("Contact not found");
    }

    return ApiSuccess.ok("Contact updated successfully", { updatedContact });
  }

  static async deleteOneContact(userId: ObjectId, id: any) {
    const deletedContact = await contactsModel.findByIdAndDelete(id);
    if (!deletedContact) {
      throw ApiError.notFound("Contact not found");
    }
    return ApiSuccess.ok("Contact deleted successfully");
  }
  // ✅ Delete all contacts
  static async deleteAllContacts() {
    await contactsModel.deleteMany({});
    return ApiSuccess.ok("All contacts deleted successfully", {});
  }

  static async findALLChurchMembersContact(
    userId: ObjectId
  ): Promise<IContacts[]> {
    return await contactsModel
      .find({ user: userId })
      .populate("user", "churchName pastorName email ")
      .populate("group");
  }
}

export default ContactsService;
