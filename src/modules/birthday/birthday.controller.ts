import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface.js";
// import ContactsService from "./contacts.service.js";
import BirthdayService from "./birthday.service.js";
import { BirthdayConfig } from "./birthday.model.js";

export class BirthDayController {
  // static async getAllBirthday(req: Request, res: Response) {
  //   const { userId } = req.user as AuthenticatedUser;
  //   const result = await BirthdayService.getTodayBirthdays(userId);
  //   res.status(200).json(result);
  // }

  static async getConfig(req: Request, res: Response) {
    try {
      const { userId } = req.user as AuthenticatedUser;

      const config = await BirthdayConfig.findOne({ user: userId }).populate(
        "template"
      );

      if (!config) {
        return res.status(200).json({
          success: true,
          data: null,
          message: "No birthday configuration found",
        });
      }

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async getAllBirthday(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { month } = req.query; // e.g. ?month=6

    const result = await BirthdayService.getBirthdaysByMonth(
      userId,
      month ? String(month) : undefined
    );

    res.status(200).json(result);
  }

  static async createOrUpdateConfig(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { enabled, templates, sendTime } = req.body;

    const config = await BirthdayConfig.findOneAndUpdate(
      { user: userId },
      {
        user: userId,
        enabled,
        templates,
        sendTime,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );
    // .populate(["templates.email", "templates.whatsapp", "templates.sms"]);

    res.status(200).json({
      success: true,
      data: config,
      message: "Birthday configuration updated successfully",
    });
  }
}
