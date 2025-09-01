import type { Request, Response } from "express";
// import { AuthService } from "./auth.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";
import ContactsService from "./fileManager.service.js";

export class fileMangerController {
  static async GetAllFileManager(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await ContactsService.allCollection(userId);
    res.status(200).json(result);
  }

  static async createFileManager(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await ContactsService.createCollection(userId);
    res.status(200).json(result);
  }

  static async createFolders(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { name } = req.body;
    const result = await ContactsService.createFolder(userId, name);
    res.status(200).json(result);
  }

  static async AddFileToFolders(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    console.log({
      fggg: req.body,
    });

    const { folder_id } = req.body;
    const image_data = req.files;

    const result = await ContactsService.AddFileTofolder(
      userId,
      folder_id,
      image_data
    );
    res.status(200).json(result);
  }

  // Get user data
  // static async getChurchProfile(req: Request, res: Response) {
  //   const { userId } = req.user as AuthenticatedUser;
  //   const result = await ContactsService.getChurchContact(userId);
  //   res.status(200).json(result);
  // }

  // // ✅ Delete all contacts
  // static async deleteAllContacts(req: Request, res: Response) {
  //   const result = await ContactsService.deleteAllContacts();
  //   res.status(200).json(result);
  // }
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
