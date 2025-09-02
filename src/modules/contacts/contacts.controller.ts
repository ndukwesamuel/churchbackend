import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface.js";
import ContactsService from "./contacts.service.js";

export class ContactsController {
  static async getChurchProfile(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await ContactsService.getChurchContact(userId);
    res.status(200).json(result);
  }
  static async createContacts(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const contactData = req.body;
    const result = await ContactsService.createContact(userId, contactData);
    res.status(200).json(result);
  }

  static async deleteAllContacts(req: Request, res: Response) {
    const result = await ContactsService.deleteAllContacts();
    res.status(200).json(result);
  }
}
