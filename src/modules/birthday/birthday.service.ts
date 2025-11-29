import type { ObjectId } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
// import contactsModel from   "./contacts.model";
// import type { IContacts } from "./contacts.interface";
// import type { IGroup } from "../group/group.interface";
import contactsModel from "../contacts/contacts.model";
import { BirthdayConfig } from "./birthday.model";
import { Template } from "../template/template.model";
import MessageService from "../messgaing/message.service";
// class ContactsService {

// export default ContactsService;
class BirthdayService {
  static async getBirthdaysByMonth(userId: ObjectId, month?: string) {
    const filter: any = { user: userId, status: "active" };

    // If a month is provided, filter by it
    if (month) {
      filter.birthMonth = month;
    }

    const contacts = await contactsModel
      .find(filter)
      .populate("group", "name")
      .sort({ fullName: 1 });

    return contacts;
  }

  /**
   * Get all contacts with birthdays this month
   */
  static async getMonthBirthdays(userId: ObjectId, month?: number) {
    const targetMonth = month || new Date().getMonth() + 1;

    const contacts = await contactsModel
      .find({
        user: userId,
        birthMonth: String(targetMonth),
        status: "active",
      })
      .populate("group", "name")
      .sort({ birthDay: 1, fullName: 1 });

    return contacts;
  }

  /**
   * Get upcoming birthdays (next 7 days)
   */
  static async getUpcomingBirthdays(userId: ObjectId, days: number = 7) {
    const today = new Date();
    const upcomingDates: Array<{ day: string; month: string }> = [];

    // Generate array of upcoming dates
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      upcomingDates.push({
        day: String(date.getDate()),
        month: String(date.getMonth() + 1),
      });
    }

    // Build query to match any of the upcoming dates
    const contacts = await contactsModel
      .find({
        user: userId,
        status: "active",
        $or: upcomingDates.map((date) => ({
          birthDay: date.day,
          birthMonth: date.month,
        })),
      })
      .populate("group", "name")
      .sort({ birthMonth: 1, birthDay: 1, fullName: 1 });

    return contacts;
  }

  /**
   * Get contacts with birthdays on a specific date
   */
  static async getBirthdaysByDate(
    userId: ObjectId,
    day: number,
    month: number
  ) {
    const contacts = await contactsModel
      .find({
        user: userId,
        birthDay: String(day),
        birthMonth: String(month),
        status: "active",
      })
      .populate("group", "name")
      .sort({ fullName: 1 });

    return contacts;
  }

  /**
   * Get all contacts with birthdays (sorted by month and day)
   */
  static async getAllBirthdays(userId: ObjectId) {
    const contacts = await contactsModel
      .find({
        user: userId,
        birthDay: { $exists: true, $ne: null },
        birthMonth: { $exists: true, $ne: null },
        status: "active",
      })
      .populate("group", "name")
      .sort({ birthMonth: 1, birthDay: 1, fullName: 1 });

    return contacts;
  }

  // static async automaticBirthdayMessageJob(userId: ObjectId) {
  //   try {
  //     const today = new Date();
  //     const day = String(today.getDate()).padStart(2, "0");
  //     const month = String(today.getMonth() + 1).padStart(2, "0");

  //     ("this is the real birhtday");

  //     // 1. Get contacts whose birthday is today
  //     const contacts = await contactsModel.find({
  //       birthDay: day,
  //       birthMonth: month,
  //     });

  //     if (contacts.length === 0) {
  //       console.log("No birthdays today");
  //       return "no-contacts";
  //     }

  //     // Groups: user + template combination
  //     const groups: Record<
  //       string,
  //       {
  //         user: any;
  //         template: any;
  //         contacts: string[];
  //         sms: string;
  //       }
  //     > = {};

  //     // 2. Loop through contacts
  //     for (const contact of contacts) {
  //       const config = await BirthdayConfig.findOne({ user: contact.user });
  //       if (!config) continue;

  //       // Get template data
  //       const templateData = await Template.findById(config.template);
  //       if (!templateData) continue;

  //       // Convert HTML to plain text
  //       const plainTextContent = templateData.content.replace(/<[^>]+>/g, "");

  //       // Unique group key
  //       const groupKey = `${contact.user}_${config.template}`;

  //       // Create or update group
  //       if (!groups[groupKey]) {
  //         groups[groupKey] = {
  //           user: contact.user,
  //           template: templateData,
  //           contacts: [],
  //           sms: plainTextContent,
  //         };
  //       }

  //       groups[groupKey].contacts.push(contact.phoneNumber);
  //     }

  //     // 3. Loop through each grouped payload and send SMS
  //     const groupedPayloads = Object.values(groups);
  //     const sendResults = [];

  //     for (const group of groupedPayloads) {
  //       const payload = {
  //         to: group.contacts, // all phone numbers for this group
  //         sms: group.sms, // message text
  //         other: group,
  //       };
  //       console.log("Sending SMS Payload:", payload);
  //       const result = await MessageService.sendBulkSMSV2(payload);
  //       sendResults.push({
  //         payload,
  //         result,
  //       });
  //     }

  //     console.log("==== BULK SMS RESULTS ====");
  //     console.log(sendResults);

  //     return sendResults;
  //   } catch (error: any) {
  //     console.error("Birthday job error:", error.message);
  //     return "error";
  //   }
  // }

  static async automaticBirthdayMessageJob(userId: ObjectId) {
    try {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");

      // 1. Get contacts whose birthday is today
      const contacts = await contactsModel.find({
        birthDay: day,
        birthMonth: month,
      });

      if (contacts.length === 0) {
        console.log("No birthdays today");
        return "no-contacts";
      }

      // Define interface for group structure
      interface GroupData {
        user: any;
        template: any;
        smsContacts: string[];
        emailContacts: string[];
        smsText: string;
        emailContent: string;
      }

      // Groups: user + template combination
      const groups: Record<string, GroupData> = {};

      // 2. Loop through contacts
      for (const contact of contacts) {
        const config = await BirthdayConfig.findOne({ user: contact.user });
        if (!config) continue;

        // Get template data
        const templateData = await Template.findById(config.template);
        if (!templateData) continue;

        // Check if template supports the channels
        const supportsSMS = templateData.channels.includes("sms");
        const supportsEmail = templateData.channels.includes("email");

        // Convert HTML to plain text for SMS
        const plainTextContent = templateData.content.replace(/<[^>]+>/g, "");

        // Unique group key
        const groupKey = `${contact.user}_${config.template}`;

        // Create or update group
        if (!groups[groupKey]) {
          groups[groupKey] = {
            user: contact.user,
            template: templateData,
            smsContacts: [],
            emailContacts: [],
            smsText: plainTextContent,
            emailContent: templateData.content, // Keep HTML for email
          };
        }

        // Add phone number if SMS is supported and contact has phone
        if (supportsSMS && contact.phoneNumber) {
          groups[groupKey].smsContacts.push(contact.phoneNumber);
        }

        // Add email if email is supported and contact has email
        if (supportsEmail && contact.email) {
          groups[groupKey].emailContacts.push(contact.email);
        }
      }

      // 3. Loop through each grouped payload and send messages
      const groupedPayloads = Object.values(groups);
      const sendResults = [];

      for (const group of groupedPayloads) {
        const result: any = {
          user: group.user,
          template: group.template._id,
        };

        // Send SMS if there are phone numbers
        if (group.smsContacts.length > 0) {
          const smsPayload = {
            to: group.smsContacts,
            sms: group.smsText,
            other: {
              user: group.user,
              template: group.template,
              contacts: group.smsContacts,
              sms: group.smsText,
            },
          };

          console.log("Sending SMS Payload:", smsPayload);

          try {
            const smsResult = await MessageService.sendBulkSMSV2(smsPayload);
            result.sms = {
              success: true,
              sent: group.smsContacts.length,
              result: smsResult,
            };
          } catch (error: any) {
            result.sms = {
              success: false,
              error: error.message,
            };
          }
        }

        // Send Email if there are email addresses
        if (group.emailContacts.length > 0) {
          const emailPayload = {
            to: group.emailContacts,
            subject: "Happy Birthday! 🎉",
            html: group.emailContent,
            other: {
              user: group.user,
              template: group.template,
              contacts: group.emailContacts,
            },
          };

          console.log("Sending Email Payload:", emailPayload);

          try {
            const emailResult = await MessageService.sendBulkEmail(
              emailPayload
            );
            result.email = {
              success: true,
              sent: group.emailContacts.length,
              result: emailResult,
            };
          } catch (error: any) {
            result.email = {
              success: false,
              error: error.message,
            };
          }
        }

        sendResults.push(result);
      }

      console.log("==== BULK MESSAGE RESULTS ====");
      console.log(JSON.stringify(sendResults, null, 2));

      return sendResults;
    } catch (error: any) {
      console.error("Birthday job error:", error.message);
      return "error";
    }
  }
}

export default BirthdayService;
