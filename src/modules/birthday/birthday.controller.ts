import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface.js";
// import ContactsService from "./contacts.service.js";
import BirthdayService from "./birthday.service.js";

export class BirthDayController {
  // static async getAllBirthday(req: Request, res: Response) {
  //   const { userId } = req.user as AuthenticatedUser;
  //   const result = await BirthdayService.getTodayBirthdays(userId);
  //   res.status(200).json(result);
  // }

  static async getAllBirthday(req: Request, res: Response) {
    const { userId } = req.user as AuthenticatedUser;
    const { month } = req.query; // e.g. ?month=6

    const result = await BirthdayService.getBirthdaysByMonth(
      userId,
      month ? String(month) : undefined
    );

    res.status(200).json(result);
  }
}
