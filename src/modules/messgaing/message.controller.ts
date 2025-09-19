import type { Request, Response } from "express";
// import { AuthService } from "./auth.service.js";
import type { AuthenticatedUser } from "../user/user.interface.js";
import ContactsService from "./message.service.js";
import MessageService from "./message.service.js";
// import ChurchProfileService from "./churchprofile.service.js";

export class MessegingController {
  // Get user data

  static async sendSmS(req: Request, res: Response) {
    try {
      let recipients = ["2348130001111", "2349022223333"];
      let senderId = "MyChurch";
      let message = "Hello, join us for Sunday service at 9AM!";
      const { userId } = req.user as AuthenticatedUser; // optional: track sender

      if (!recipients || !senderId || !message) {
        return res.status(400).json({
          status: false,
          message: "recipients, senderId, and message are required",
        });
      }

      // Send SMS via Termii
      const result = await MessageService.sendBulkSMS(
        recipients,
        senderId,
        message
      );

      // Optional: log that userId triggered this
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        status: false,
        message: error.message || "Failed to send SMS",
      });
    }
  }

  static async sendEmail(req: Request, res: Response) {
    try {
      let recipients = ["2348130001111", "2349022223333"];
      let senderId = "MyChurch";
      let message = "Hello, join us for Sunday service at 9AM!";
      const { userId } = req.user as AuthenticatedUser; // optional: track sender

      if (!recipients || !senderId || !message) {
        return res.status(400).json({
          status: false,
          message: "recipients, senderId, and message are required",
        });
      }

      // Send SMS via Termii
      const result = await MessageService.sendBulkSMS(
        recipients,
        senderId,
        message
      );

      // Optional: log that userId triggered this
      return res.status(200).json(result);
    } catch (error: any) {
      return res.status(500).json({
        status: false,
        message: error.message || "Failed to send SMS",
      });
    }
  }
}
