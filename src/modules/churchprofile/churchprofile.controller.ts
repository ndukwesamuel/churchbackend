import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface.js";
import ChurchProfileService from "./churchprofile.service.js";

export class ChurchProfileController {
  static async getChurchProfile(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await ChurchProfileService.getChurchProfile(userId);
    res.status(200).json(result);
  }

  static async createGroup(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const groupData = req.body;
    const result = await ChurchProfileService.createChurchGroup(
      userId,
      groupData
    );
    res.status(200).json(result);
  }
  static async getChurchGroupsWithCounts(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await ChurchProfileService.getChurchGroupsWithCounts(userId);
    res.status(200).json(result);
  }
  static async updateChurchProfile(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const groupData = req.body;
    const result = await ChurchProfileService.updateChurchProfile(
      userId,
      groupData
    );
    res.status(200).json(result);
  }
}
