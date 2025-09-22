import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface.js";
import ContactsService from "./contacts.service.js";

export class ContactsController {
  static async getChurchContact(req: Request, res: Response) {
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

  static async createBulkContacts(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const contactData = req.body;
    const result = await ContactsService.bulkCreateContacts(
      userId,
      contactData
    );
    res.status(200).json(contactData);
  }
  // ContactsController.ts

  // ... (existing methods like createContacts)

  static async bulkCreateContacts(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;

    // 1. Destructure and provide a default empty array if 'contacts' is missing
    const { contacts = [] } = req.body;

    // 2. Explicitly check if it's an array and not empty
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({
        success: false,
        status: "Error",
        message:
          "No contact data found in the request body, or data is not a valid array.",
      });
    }

    // Call the service layer with the guaranteed array
    const result = await ContactsService.bulkCreateContacts(userId, contacts);

    res.status(200).json(result);
  }

  static async updateContacts(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const contactData = req.body;
    const { id } = req.params;
    const result = await ContactsService.UpdateContact(userId, id, contactData);
    res.status(200).json(result);
  }

  static async deleteOneContact(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { id } = req.params;
    const result = await ContactsService.deleteOneContact(userId, id);
    res.status(200).json(result);
  }

  // ✅ Delete all contacts
  static async deleteAllContacts(req: Request, res: Response) {
    const result = await ContactsService.deleteAllContacts();
    res.status(200).json(result);
  }
  // static async login(req: Request, res: Response) {
  //   const userData = req.body;
  //   const result = await AuthService.churchlogin(userData);
  //   res.status(200).json(result);
  // }
  // // Register user
  // static async register(req: Request, res: Response) {
  //   const userData = req.body;
  //   const result = await AuthService.register(userData);
  //   res.status(201).json(result);
  // }
  // // Login user
  // // Send OTP
  // static async sendOTP(req: Request, res: Response) {
  //   const { email } = req.body;
  //   const result = await AuthService.sendOTP({ email });
  //   res.status(200).json(result);
  // }
  // // Verify OTP
  // static async verifyOTP(req: Request, res: Response) {
  //   const { email, otp } = req.body;
  //   const result = await AuthService.verifyOTP({ email, otp });
  //   res.status(200).json(result);
  // }
  // // Forgot password
  // static async forgotPassword(req: Request, res: Response) {
  //   const { email } = req.body;
  //   const result = await AuthService.forgotPassword({ email });
  //   res.status(200).json(result);
  // }
  // // Reset password
  // static async resetPassword(req: Request, res: Response) {
  //   const { email, otp, password } = req.body;
  //   const result = await AuthService.resetPassword({ email, otp, password });
  //   res.status(200).json(result);
  // }
}
