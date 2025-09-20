import type { Request, Response } from "express";
import { ChannelConfigService } from "./channelConfig.service";
import type { AuthenticatedUser } from "../user/user.interface";

export class ChannelConfigController {
  static async createChannelConfig(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const payload = req.body;

    const result = await ChannelConfigService.createChannelConfig(
      userId,
      payload
    );
    res.status(200).json(result);
  }

  static async updateChannelConfig(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const payload = req.body;
    const result = await ChannelConfigService.updateChannelConfig(
      userId,
      payload
    );
    res.status(200).json(result);
  }

  static async getChannelConfig(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await ChannelConfigService.getChannelConfig(userId);
    res.status(200).json(result);
  }
}
