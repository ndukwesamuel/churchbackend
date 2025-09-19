import type { ObjectId } from "mongoose";
import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import { hashPassword } from "../../utils/validationUtils";
import type { RegisterDTO } from "../auth/auth.interface";
import axios from "axios";
// import type { IUserProfile } from "./churchprofile.interface";
import churchModel from "../church/church.model";

import contactsModel from "./contacts.model";
import type { IContacts } from "./contacts.interface";
const TERMII_BASE_URL =
  process.env.TERMII_BASE_URL || "https://api.ng.termii.com/api/sms/send";
const TERMII_API_KEY =
  process.env.TERMII_API_KEY ||
  "TLnMfjVvHrTdaihJYhexOquvDQMESDSbRbwvVaVbBgsKxfQTJTMNEVWzBabrsf";
// import type { IUser } from "./churchprofile.interface";
// import User from "./user.model";

class MessageService {
  static async sendBulkSMS(
    recipients: string[],
    senderId: string,
    message: string
  ) {
    try {
      const response = await axios.post(TERMII_BASE_URL, {
        api_key: TERMII_API_KEY,
        to: recipients.join(","), // join numbers with comma
        from:  "MyChurch", // senderId,
        sms: message,
        type: "plain",
        channel: "generic",
      });

      return ApiSuccess.ok("SMS sent successfully", response.data);
    } catch (error: any) {
      throw ApiError.badRequest(error.response?.data || error.message);
    }
  }
}

export default MessageService;
