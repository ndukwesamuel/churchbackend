import type { ObjectId } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import type { IUserProfile } from "./churchprofile.interface";
import churchModel from "../church/church.model";
import churchprofileModel from "./churchprofile.model";
import ContactsModel from "../contacts/contacts.model";
class ChurchProfileService {
  static async getChurchProfile(userId: ObjectId) {
    const user = await this.findChurchById(userId);
    return ApiSuccess.ok("Church Profile Retrieved Successfully", {
      user,
    });
  }

  static async getChurchGroupsWithCounts(userId: ObjectId) {
    // Step 1: find the church profile (with groups defined)
    const churchProfile = await churchprofileModel.findOne({ user: userId });
    if (!churchProfile) {
      throw ApiError.notFound("Church profile not found");
    }

    // Step 2: aggregate contacts by group
    const counts = await ContactsModel.aggregate([
      { $match: { user: userId } },
      { $group: { _id: "$group", count: { $sum: 1 } } },
    ]);

    // Step 3: map counts into groups array
    const groupsWithCounts = churchProfile.groups.map((group) => {
      const match = counts.find(
        (c) => c._id?.toString() === group._id!.toString()
      );
      console.log(match);
      return {
        groupId: group._id,
        name: group.name,
        description: group.description,
        memberCount: match ? match.count : 0,
      };
    });

    return ApiSuccess.ok("Groups retrieved successfully", {
      groups: groupsWithCounts,
    });
  }
  static async createChurchGroup(userId: ObjectId, groupData: any) {
    const churchProfile = await this.findChurchById(userId);

    if (this.isDuplicateGroupName(churchProfile.groups, groupData.name)) {
      throw ApiError.badRequest("Group name already exists in this church");
    }

    // Push the new group into the groups array
    churchProfile.groups.push({
      name: groupData.name,
      description: groupData.description,
    });

    await churchProfile.save();
    return ApiSuccess.ok("Group Created Successfully", {
      groups: churchProfile.groups,
    });
  }

  static async updateChurchProfile(userId: ObjectId, groupData: any) {
    const { churchName, pastorName, address, email, phone, website } =
      groupData;

    const updates: Record<string, any> = {};

    if (churchName !== undefined) updates.churchName = churchName;
    if (pastorName !== undefined) updates.pastorName = pastorName;
    if (address !== undefined) updates.address = address;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (website !== undefined) updates.website = website;

    const updatedProfile = await churchModel.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedProfile) {
      throw ApiError.notFound("Profile Not Found");
    }

    return ApiSuccess.ok("Profile updated Successfully", {
      data: updatedProfile,
      userId,
    });
  }

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
