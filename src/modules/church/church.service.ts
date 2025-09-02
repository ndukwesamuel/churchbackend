import type { ObjectId } from "mongoose";
import { ApiError } from "../../utils/responseHandler";
import churchModel from "../church/church.model";
import type { IChurch } from "../church/church.interface";

export class ChurchService {
  static async findChurchById(userId: ObjectId): Promise<IChurch> {
    const user = await churchModel.findById(userId);

    if (!user) {
      throw ApiError.notFound("User Not Found");
    }

    return user;
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
