import type { Request, Response } from "express";
import { GroupService } from "./group.service";

export class GroupController {
  static async createGroup(req: Request, res: Response) {
    const { userId } = req.user;
    const group_body = req.body;
    const result = await GroupService.createGroup(userId, group_body);
    res.status(201).json(result);
  }

  static async getGroups(req: Request, res: Response) {
    const { userId } = req.user;
    const result = await GroupService.getGroups(userId);
    res.status(200).json(result);
  }

  static async getGroupById(req: Request, res: Response) {
    const { groupId } = req.params as { groupId: string };
    const result = await GroupService.getGroupById(groupId);
    res.status(200).json(result);
  }

  static async updateGroup(req: Request, res: Response) {
    const { groupId } = req.params as { groupId: string };

    const result = await GroupService.updateGroup(groupId, req.body);
    res.status(200).json(result);
  }

  static async deleteGroup(req: Request, res: Response) {
    const { groupId } = req.params as { groupId: string };

    const result = await GroupService.deleteGroup(groupId);
    res.status(200).json(result);
  }
}
