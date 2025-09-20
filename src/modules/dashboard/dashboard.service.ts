import type { ObjectId } from "mongoose";
import ContactsModel from "../contacts/contacts.model";
import MessageModel from "../message/message.model";
import mongoose from "mongoose";

export class DashboardService {
  static async getAllStats(userId: ObjectId) {
    try {
      const userObjectId =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      // Count active contacts
      const activeUsers = await ContactsModel.countDocuments({
        user: userObjectId,
        status: "active",
      });

      // Total messages sent
      const totalMessagesSent = await MessageModel.countDocuments({
        createdBy: userObjectId,
        status: "sent",
      });

      // Total messages per type (sent only)
      const messageTypeCounts = await MessageModel.aggregate([
        {
          $match: {
            createdBy: userObjectId,
            status: "sent",
          },
        },
        {
          $group: {
            _id: "$messageType",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            messageType: "$_id",
            count: 1,
          },
        },
      ]);

      // Message details (sent only)
      const messageDetails = await MessageModel.find(
        { createdBy: userObjectId, status: "sent" },
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
