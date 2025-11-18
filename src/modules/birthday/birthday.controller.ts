import type { Request, Response } from "express";
import type { AuthenticatedUser } from "../user/user.interface.js";
// import ContactsService from "./contacts.service.js";
import BirthdayService from "./birthday.service.js";
import { BirthdayConfig } from "./birthday.model.js";
import mongoose from "mongoose";
import MessageService from "../messgaing/message.service.js";
import contactsModel from "../contacts/contacts.model.js";

export class BirthDayController {
  // static async getAllBirthday(req: Request, res: Response) {
  //   const { userId } = req.user as AuthenticatedUser;
  //   const result = await BirthdayService.getTodayBirthdays(userId);
  //   res.status(200).json(result);
  // }

  static async getConfig(req: Request, res: Response) {
    try {
      const { userId } = req.user.userId as AuthenticatedUser;

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
    try {
      const { userId } = req.user as AuthenticatedUser;

      console.log({
        tyu: userId,
      });

      const { enabled, template, selectedChannels, sendTime } = req.body;

      // ✅ Validate that template exists
      if (template) {
        const Template = mongoose.model("Template");
        const templateExists = await Template.findById(template);

        if (!templateExists) {
          return res.status(400).json({
            success: false,
            message: "Template not found. Please select a valid template.",
          });
        }

        // ✅ Validate that selected channels are supported by the template
        const invalidChannels = selectedChannels.filter(
          (channel: string) => !templateExists.channels.includes(channel)
        );

        if (invalidChannels.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Template does not support channels: ${invalidChannels.join(
              ", "
            )}`,
          });
        }
      }

      // ✅ Find and update the ONE config for this user (regardless of template)
      const config = await BirthdayConfig.findOneAndUpdate(
        { user: userId }, // Only match by user, not template
        {
          user: userId,
          enabled,
          template,
          selectedChannels,
          sendTime,
        },
        {
          new: true,
          upsert: true, // Create if doesn't exist
          runValidators: true,
        }
      ).populate("template");

      res.status(200).json({
        success: true,
        data: config,
        message: "Birthday configuration saved successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
  static async getAllConfigs(req: Request, res: Response) {
    try {
      const { userId } = req.user as AuthenticatedUser;

      const configs = await BirthdayConfig.find({ user: userId })
        .populate("template")
        .populate("user", "churchName pastorName email")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: configs,
        count: configs.length,
        message: "Birthday configurations retrieved successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteConfig(req: Request, res: Response) {
    try {
      const { userId } = req.user as AuthenticatedUser;

      const { configId } = req.params;

      const config = await BirthdayConfig.findOneAndDelete({
        _id: configId,
        user: userId,
      });

      if (!config) {
        return res.status(404).json({
          success: false,
          message: "Birthday configuration not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Birthday configuration deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async sendTestBirthdayMessage(req: Request, res: Response) {
    try {
      const { userId } = req.user as AuthenticatedUser;
      const { contactId, channel } = req.body;

      // Get the configuration
      const config = await BirthdayConfig.findOne({ user: userId })
        .populate("user")
        .populate("template");

      if (!config || !config.template) {
        return res.status(400).json({
          success: false,
          message: "Birthday configuration or template not found",
        });
      }

      // Get the contact
      const Contact = mongoose.model("Contact");
      const contact = await Contact.findOne({ _id: contactId, user: userId });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Contact not found",
        });
      }
      // Helper function to strip HTML tags
      const stripHtml = (html: string): string => {
        return html
          .replace(/<[^>]*>/g, "") // Remove HTML tags
          .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
          .replace(/&amp;/g, "&") // Replace &amp; with &
          .replace(/&lt;/g, "<") // Replace &lt; with
          .replace(/&gt;/g, ">") // Replace &gt; with >
          .replace(/&quot;/g, '"') // Replace &quot; with "
          .replace(/&#39;/g, "'") // Replace &#39; with '
          .replace(/\s+/g, " ") // Replace multiple spaces with single space
          .trim(); // Trim leading/trailing spaces
      };
      let results;
      if (channel === "email") {
        const payload = {
          // from: "Kitovu Support <onboarding@resend.dev>",
          to: [contact.email],
          subject: config.template.name,
          html: ` ${config.template.content}       `,
        };

        // Send test message
        results = await MessageService.sendBulkEmail(payload);
      }
      const plainTextContent = stripHtml(config.template.content);

      if (channel === "sms") {
        const payload = {
          to: [contact.phoneNumber, "2349167703400"],
          // sms: ` ${config.template.content}       `,
          sms: plainTextContent,
        };
        results = await MessageService.sendBulkSMSV2(payload);
      }

      res.status(200).json({
        success: true,
        ddd: plainTextContent,
        data: results,
        message: "Test birthday message sent successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async sendTestBirthdayMessageJob(req: Request, res: Response) {
    try {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");

      // 1. Get contacts celebrating birthday today
      const contacts = await contactsModel.find({
        birthDay: day,
        birthMonth: month,
      });

      if (contacts.length === 0) {
        console.log("No birthday");

        // return res.status(200).json({
        //   success: true,
        //   contacts: [],
        //   message: "No birthdays today",
        // });
      }

      // 2. For each contact, get its BirthdayConfig
      const results = [];

      for (const contact of contacts) {
        const config = await BirthdayConfig.findOne({ user: contact.user })
          .populate("user")
          .populate("template");

        results.push({
          contact,
          config,
        });
      }

      // console.log full result
      console.log({
        rrtt: contacts,
        birthdayResults: results,
      });

      return;

      // return res.status(200).json({
      //   success: true,
      //   data: results,
      //   message: "Birthday configs fetched successfully",
      // });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}
