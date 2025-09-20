import type { Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import type { AuthenticatedUser } from "../user/user.interface";
export class DashboardController {
  static async getAllStats(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await DashboardService.getAllStats(userId);
    res.status(200).json(result);
  }
}
