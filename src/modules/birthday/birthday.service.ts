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
//   static async getChurchContact(userId: ObjectId) {
//     const members = await this.findALLChurchMembersContact(userId);

//     // Count members by group
//     const groupCounts = members.reduce((acc, member) => {
//       const group = member.group;

//       // type guard: only count if it's a populated group
//       if (group && typeof group !== "string" && "_id" in group) {
//         const groupId = group._id.toString();
//         if (!acc[groupId]) {
//           acc[groupId] = {
//             groupId,
//             groupName: (group as IGroup).name,
//             count: 0,
//           };
//         }
//         acc[groupId].count += 1;
//       }

//       return acc;
//     }, {} as Record<string, { groupId: string; groupName: string; count: number }>);

//     return ApiSuccess.ok("Church Member Retrieved Successfully", {
//       memberCount: members.length,
//       members,
//       groupCounts: Object.values(groupCounts),
//       groupTotal: Object.keys(groupCounts).length,
//     });
//   }

//   // static async createContact(userId: ObjectId, contactData: any) {
//   //   const contactPayload: any = {
//   //     user: userId,
//   //     fullName: contactData.fullName,
//   //     email: contactData.email,
//   //     phoneNumber: contactData.phoneNumber,
//   //   };
//   //   if (contactData.groupId) {
//   //     contactPayload.group = contactData.groupId; // ✅ only set if valid
//   //   }

//   //   const contact = await contactsModel.create(contactPayload);

//   //   return ApiSuccess.ok("Contact created successfully", { contact });
//   // }

//   // static async UpdateContact(userId: ObjectId, id: any, contactData: any) {
//   //   const updatedContact = await contactsModel.findByIdAndUpdate(
//   //     id,
//   //     contactData,
//   //     {
//   //       new: true, // return updated doc
//   //       runValidators: true, // apply schema validators
//   //     }
//   //   );
//   //   if (!updatedContact) {
//   //     throw ApiError.notFound("Contact not found");
//   //   }

//   //   return ApiSuccess.ok("Contact updated successfully", { updatedContact });
//   // }

//   static async createContact(userId: ObjectId, contactData: any) {
//     const contactPayload: any = {
//       user: userId,
//       fullName: contactData.fullName,
//       email: contactData.email,
//       phoneNumber: contactData.phoneNumber,
//       status: contactData.status || "active",
//       role: contactData.role || "Member",
//     };

//     // Add group if provided
//     if (contactData.groupId) {
//       contactPayload.group = contactData.groupId;
//     }

//     // Add birthday fields if provided
//     if (contactData.birthDay) {
//       contactPayload.birthDay = contactData.birthDay;
//     }

//     if (contactData.birthMonth) {
//       contactPayload.birthMonth = contactData.birthMonth;
//     }

//     const contact = await contactsModel.create(contactPayload);

//     return ApiSuccess.ok("Contact created successfully", { contact });
//   }

//   // Update method should also handle birthday fields
//   static async updateContact(
//     contactId: ObjectId,
//     userId: ObjectId,
//     contactData: any
//   ) {
//     const updatePayload: any = {
//       fullName: contactData.fullName,
//       email: contactData.email,
//       phoneNumber: contactData.phoneNumber,
//       status: contactData.status,
//       role: contactData.role,
//     };

//     // Add group if provided
//     if (contactData.groupId) {
//       updatePayload.group = contactData.groupId;
//     }

//     // Add birthday fields if provided
//     if (contactData.birthDay !== undefined) {
//       updatePayload.birthDay = contactData.birthDay;
//     }

//     if (contactData.birthMonth !== undefined) {
//       updatePayload.birthMonth = contactData.birthMonth;
//     }

//     const contact = await contactsModel.findOneAndUpdate(
//       { _id: contactId, user: userId },
//       updatePayload,
//       { new: true, runValidators: true }
//     );

//     if (!contact) {
//       throw ApiError.notFound("Contact not found");
//     }

//     return ApiSuccess.ok("Contact updated successfully", { contact });
//   }

//   static async deleteOneContact(userId: ObjectId, id: any) {
//     const deletedContact = await contactsModel.findByIdAndDelete(id);
//     if (!deletedContact) {
//       throw ApiError.notFound("Contact not found");
//     }
//     return ApiSuccess.ok("Contact deleted successfully");
//   }
//   // ✅ Delete all contacts
//   static async deleteAllContacts() {
//     await contactsModel.deleteMany({});
//     return ApiSuccess.ok("All contacts deleted successfully", {});
//   }

//   static async findALLChurchMembersContact(
//     userId: ObjectId
//   ): Promise<IContacts[]> {
//     return await contactsModel
//       .find({ user: userId })
//       .populate("user", "churchName pastorName email ")
//       .populate("group");
//   }

//   // ContactsService.ts (New method)

//   static async bulkCreateContacts(userId: ObjectId, contactDataArray: any[]) {
//     // 1. Prepare the final list of documents to insert
//     const contactsToInsert: any[] = [];
//     const failedContacts: any[] = [];

//     // 2. Iterate and validate/prepare each contact
//     for (const contactData of contactDataArray) {
//       try {
//         // Apply server-side standardization if not already done by front-end
//         const standardizedPhoneNumber = ContactsService.standardizePhoneNumber(
//           contactData.phoneNumber
//         );

//         // Basic validation check for required fields (can be expanded)
//         if (!contactData.fullName || !standardizedPhoneNumber) {
//           failedContacts.push({
//             data: contactData,
//             reason: "Missing full name or phone number",
//           });
//           continue; // Skip to the next contact
//         }

//         const contactPayload: any = {
//           user: userId,
//           fullName: contactData.fullName,
//           email: contactData.email || undefined, // Allow optional email
//           phoneNumber: standardizedPhoneNumber,
//           status: contactData.status?.toLowerCase() || "active", // Default status
//           role: contactData.role || "Member", // Default role
//         };

//         // Only include group if a groupId is provided
//         if (contactData.groupId) {
//           contactPayload.group = contactData.groupId;
//         }

//         contactsToInsert.push(contactPayload);
//       } catch (error) {
//         // Catch errors during phone number standardization or other preparation
//         failedContacts.push({
//           data: contactData,
//           reason: "Data processing error: " + (error as Error).message,
//         });
//       }
//     }

//     // 3. Perform the bulk insert if there are contacts to add
//     let insertedContacts = [];
//     let bulkInsertError: any = null;

//     if (contactsToInsert.length > 0) {
//       try {
//         // Mongoose's insertMany is highly efficient for bulk operations
//         insertedContacts = await contactsModel.insertMany(contactsToInsert, {
//           ordered: false,
//         });
//       } catch (error: any) {
//         // This catches validation errors that occur during the DB insert
//         if (error.writeErrors) {
//           // MongoDB errors contain detailed info about failed documents
//           error.writeErrors.forEach((err: any) => {
//             const failedDoc = contactsToInsert[err.index];
//             failedContacts.push({
//               data: failedDoc,
//               reason: err.errmsg || "MongoDB validation failed",
//             });
//           });
//           // Keep the successfully inserted documents (those not in writeErrors)
//           insertedContacts = error.insertedDocs || [];
//         } else {
//           bulkInsertError = error;
//         }
//       }
//     }

//     // 4. Return a summary result
//     const totalProcessed = contactDataArray.length;
//     const totalInserted = insertedContacts.length;
//     const totalFailed = failedContacts.length;

//     return ApiSuccess.ok("Bulk contact upload processed", {
//       totalProcessed,
//       totalInserted,
//       totalFailed,
//       failedContacts, // List any documents that failed to insert
//       bulkInsertError: bulkInsertError
//         ? "An unrecoverable error occurred during bulk insert."
//         : undefined,
//     });
//   }

//   // You must also add the standardization function to your Service class
//   static standardizePhoneNumber(inputNumber: any): string {
//     if (!inputNumber) return "";
//     // Ensure the input is treated as a string for replacement
//     const digitsOnly = String(inputNumber).replace(/\D/g, "");

//     // Check if it starts with '0' (Nigerian local format)
//     if (digitsOnly.length > 0 && digitsOnly.startsWith("0")) {
//       // Remove '0' and prepend '234'
//       return "234" + digitsOnly.substring(1);
//     }
//     // Return as is (could be '234...' or another international format)
//     return digitsOnly;
//   }
// }

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
  //   const today = new Date();
  //   const day = String(today.getDate()).padStart(2, "0");
  //   const month = String(today.getMonth() + 1).padStart(2, "0");

  //   const contacts = await contactsModel.find({
  //     birthDay: day,
  //     birthMonth: month,
  //   });

  //   if (contacts.length === 0) {
  //     console.log("No birthday");
  //   }

  //   const results = [];

  //   for (const contact of contacts) {
  //     const config = await BirthdayConfig.findOne({ user: contact.user });

  //     if (!config) continue;

  //     // Get template ID
  //     const templateId = config.template;

  //     // Fetch full template data
  //     const templateData = await Template.findById(templateId);

  //     console.log({
  //       contacts,
  //       config_id: config._id,
  //       configtemplate: config.template,
  //       configselectedChannels: config.selectedChannels,
  //       templateData,
  //     });
  //     results.push({
  //       contact,
  //       config,
  //       template: templateData, // full template object
  //     });
  //   }

  //   console.log({
  //     rrtt: contacts,
  //     birthdayResults: results,
  //   });

  //   return "contacts";
  // }

  // static async automaticBirthdayMessageJob(userId: ObjectId) {
  //   try {
  //     const today = new Date();
  //     const day = String(today.getDate()).padStart(2, "0");
  //     const month = String(today.getMonth() + 1).padStart(2, "0");

  //     // 1. Get contacts whose birthday is today
  //     const contacts = await contactsModel.find({
  //       birthDay: day,
  //       birthMonth: month,
  //     });

  //     if (contacts.length === 0) {
  //       console.log("No birthday today");
  //       return "no-contacts";
  //     }

  //     // This will store grouped results
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
  //       if (!config) continue; // skip if no config

  //       // Fetch full template data
  //       const templateData = await Template.findById(config.template);
  //       if (!templateData) continue;

  //       // Convert HTML → plain text
  //       const plainTextContent = templateData.content.replace(/<[^>]+>/g, "");

  //       // unique group key = user + template
  //       const groupKey = `${contact.user}_${config.template}`;

  //       // Create group if not exists
  //       if (!groups[groupKey]) {
  //         groups[groupKey] = {
  //           user: contact.user,
  //           template: templateData,
  //           contacts: [],
  //           sms: plainTextContent,
  //         };
  //       }

  //       // Add phone number
  //       groups[groupKey].contacts.push(contact.phoneNumber);
  //     }

  //     // 3. Convert grouped results to payloads for sending
  //     const groupedPayloads = Object.values(groups).map((group) => ({
  //       to: group.contacts, // all phone numbers under this template
  //       sms: group.sms, // plain-text message
  //       user: group.user,
  //       templateId: group.template._id,
  //       template: group.template,
  //     }));

  //     console.log("==== GROUPED BIRTHDAY PAYLOADS ====");
  //     console.log(groupedPayloads);

  //     return groupedPayloads;
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
        birthDay: "32", //day,
        birthMonth: "12", //month,
      });

      if (contacts.length === 0) {
        console.log("No birthdays today");
        return "no-contacts";
      }

      // Groups: user + template combination
      const groups: Record<
        string,
        {
          user: any;
          template: any;
          contacts: string[];
          sms: string;
        }
      > = {};

      // 2. Loop through contacts
      for (const contact of contacts) {
        const config = await BirthdayConfig.findOne({ user: contact.user });
        if (!config) continue;

        // Get template data
        const templateData = await Template.findById(config.template);
        if (!templateData) continue;

        // Convert HTML to plain text
        const plainTextContent = templateData.content.replace(/<[^>]+>/g, "");

        // Unique group key
        const groupKey = `${contact.user}_${config.template}`;

        // Create or update group
        if (!groups[groupKey]) {
          groups[groupKey] = {
            user: contact.user,
            template: templateData,
            contacts: [],
            sms: plainTextContent,
          };
        }

        groups[groupKey].contacts.push(contact.phoneNumber);
      }

      // 3. Loop through each grouped payload and send SMS
      const groupedPayloads = Object.values(groups);
      const sendResults = [];

      for (const group of groupedPayloads) {
        const payload = {
          to: group.contacts, // all phone numbers for this group
          sms: group.sms, // message text
        };
        console.log("Sending SMS Payload:", payload);
        const result = await MessageService.sendBulkSMSV2(payload);
        sendResults.push({
          payload,
          result,
        });
      }

      console.log("==== BULK SMS RESULTS ====");
      console.log(sendResults);

      return sendResults;
    } catch (error: any) {
      console.error("Birthday job error:", error.message);
      return "error";
    }
  }
}

export default BirthdayService;
