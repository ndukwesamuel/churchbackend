import type { ObjectId } from "mongoose";
import ContactsModel from "../contacts/contacts.model";
import MessageModel from "../message/message.model";
export class DashboardService {
  static async getAllStats(userId: ObjectId) {
    try {
      // Count active contacts
      const activeUsers = await ContactsModel.countDocuments({
        user: userId,
        status: "active",
      });

      // Total messages sent
      const totalMessagesSent = await MessageModel.countDocuments({
        createdBy: userId,
        status: "sent",
      });

      // Total messages per type (sent only)
      const messageTypeCounts = await MessageModel.aggregate([
        {
          $match: {
            createdBy: userId,
            status: "sent",
          },
        },
        {
          $group: {
            _id: "$messageType",
            count: { $sum: 1 },
          },
        },
      ]);

      // Message details (sent only)
      const messageDetails = await MessageModel.find(
        { createdBy: userId, status: "sent" },
        {
          message: 1,
          messageType: 1,
          totalRecipients: 1,
          totalCost: 1,
          sentAt: 1,
        }
      )
        .sort({ sentAt: -1 }) // newest first
        .lean();

      return {
        success: true,
        data: {
          activeUsers,
          totalMessagesSent,
          messageTypeCounts,
          messageDetails,
        },
      };
    } catch (error) {
      console.error("Error in DashboardService.getAllStats:", error);
      throw new Error("Failed to fetch dashboard stats");
    }
  }
}
