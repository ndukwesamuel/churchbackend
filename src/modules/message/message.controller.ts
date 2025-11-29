import type { Request, Response } from "express";
import { MessageService } from "./message.service";
import type { AuthenticatedUser } from "../user/user.interface";

export class MessageController {
  static async createMessage(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await MessageService.createMessage(req.body, userId);
    res.status(201).json(result);
  }

  static async getMessages(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await MessageService.getMessages(userId);
    res.status(200).json(result);
  }

  static async getMessageById(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;

    const result = await MessageService.getMessageById(
      req.params.id as string,
      userId
    );

    res.status(200).json(result);
  }

  static async updateMessage(req: Request, res: Response) {
    const result = await MessageService.updateMessage(
      req.params.id as string,
      req.body
    );
    res.status(200).json(result);
  }

  static async deleteMessage(req: Request, res: Response) {
    const result = await MessageService.deleteMessage(req.params.id as string);
    res.status(200).json(result);
  }

  static async GetAllBAD(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await MessageService.getScheduledMessages(userId);
    res.status(200).json(result);
  }
}
