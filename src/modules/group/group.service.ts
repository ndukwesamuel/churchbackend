import { Types } from "mongoose";
import { ApiSuccess, ApiError } from "../../utils/responseHandler";
import groupModel from "./group.model";
import type { IGroup } from "./group.interface";
export class GroupService {
  static async createGroup(groupData: any) {
    const group = await groupModel.create(groupData);
    return ApiSuccess.ok("Group created successfully", { group });
  }

  static async getGroups() {
    const groups = await groupModel.find();
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
