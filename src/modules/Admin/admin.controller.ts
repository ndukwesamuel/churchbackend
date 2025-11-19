import type { Request, Response } from "express";
import { AuthService } from "../auth/auth.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";
import AdminserService from "./admin.service.js";
import ContactsService from "../contacts/contacts.service.js";

export class AdminController {
  static async Adminregister(req: Request, res: Response) {
    const userData = req.body;
    const result = await AdminserService.createAdmiinUser(userData);
    res.status(201).json(result);
  }

  static async GetALLCOntact(req: Request, res: Response) {
    // const userData = req.body;
    const result = await ContactsService.Adminfindallcontact();
    res.status(200).json(result);
  }
  // Register user
  static async register(req: Request, res: Response) {
    const userData = req.body;
    const result = await AuthService.register(userData);
    res.status(201).json(result);
  }

  // // Login user

  // // Get user data
  // static async getUser(req: Request, res: Response) {
  //   const { userId } = req.user as AuthenticatedUser;
  //   const result = await AuthService.getUser(userId);
  //   res.status(200).json(result);
  // }

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
