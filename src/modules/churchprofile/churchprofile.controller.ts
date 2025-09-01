import type { Request, Response } from "express";
// import { AuthService } from "./auth.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";
import ChurchProfileService from "./churchprofile.service.js";

export class ChurchProfileController {
  // Get user data
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
