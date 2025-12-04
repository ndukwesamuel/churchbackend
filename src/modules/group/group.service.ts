import { Types } from "mongoose";
import { ApiSuccess, ApiError } from "../../utils/responseHandler";
import groupModel from "./group.model";
import type { IGroup } from "./group.interface";
export class GroupService {
  // static async createGroup(groupData: any) {
  //   const group = await groupModel.create(groupData);
  //   return ApiSuccess.ok("Group created successfully", { group });
  // }

  static async createGroup(userId: string, groupData: any) {
    // 1. Combine the group data with the authenticated user's ID
    const group = await groupModel.create({
      ...groupData,
      owner: userId, // <-- CRUCIAL: Assigns the user as the owner
    });

    // 2. Return the success response
    return ApiSuccess.created("Group created successfully", { group });
  }

  static async getGroups(userId) {
    const groups = await groupModel.find({
      $or: [
        { owner: userId }, // Groups owned by the user
        { owner: { $exists: false } }, // Groups that were seeded (have no 'owner' field)
      ],
    });

    return ApiSuccess.ok("Groups retrieved successfully", {
      count: groups.length,
      groups,
    });
  }

  static async getGroupById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest("Invalid group ID format");
    }

    const group = await groupModel.findById(id);
    if (!group) throw ApiError.notFound("Group not found");
    return ApiSuccess.ok("Group retrieved successfully", { group });
  }

  static async updateGroup(id: string, groupData: IGroup) {
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest("Invalid group ID format");
    }

    const updatedGroup = await groupModel.findByIdAndUpdate(id, groupData, {
      new: true,
      runValidators: true,
    });
    if (!updatedGroup) throw ApiError.notFound("Group not found");

    return ApiSuccess.ok("Group updated successfully", { updatedGroup });
  }

  static async deleteGroup(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest("Invalid group ID format");
    }
    const deleted = await groupModel.findByIdAndDelete(id);
    if (!deleted) throw ApiError.notFound("Group not found");

    return ApiSuccess.ok("Group deleted successfully", {});
  }
}
