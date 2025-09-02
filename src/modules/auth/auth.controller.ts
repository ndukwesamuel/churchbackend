import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import type { AuthenticatedUser } from "../user/user.interface";
import { env } from "../../config/env.config";
export class AuthController {
  static async churchRegister(req: Request, res: Response) {
    const userData = req.body;
    const result = await AuthService.churchRegister(userData);
    res.status(201).json(result);
  }

  static async churchLogin(req: Request, res: Response) {
    const userData = req.body;
    const result = await AuthService.churchlogin(userData);

    res.status(200).json(result);
  }

  // Get user data
  static async getUser(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const result = await AuthService.getUser(userId);
    res.status(200).json(result);
  }

  // Send OTP
  static async sendOTP(req: Request, res: Response) {
    const { email } = req.body;
    const result = await AuthService.sendOTP({ email });
    res.status(200).json(result);
  }

  // Verify OTP
  static async verifyOTP(req: Request, res: Response) {
    const { email, otp } = req.body;
    const result = await AuthService.verifyOTP({ email, otp });
    res.status(200).json(result);
  }

  // Forgot password
  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const result = await AuthService.forgotPassword({ email });
    res.status(200).json(result);
  }

  // Reset password
  static async resetPassword(req: Request, res: Response) {
    const { email, otp, password } = req.body;
    const result = await AuthService.resetPassword({ email, otp, password });
    res.status(200).json(result);
  }
}
