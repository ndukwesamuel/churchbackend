import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import axios from "axios";

const TERMII_BASE_URL =
  process.env.TERMII_BASE_URL || "https://api.ng.termii.com/api/sms/send";
<<<<<<< HEAD
const TERMII_API_KEY =
  process.env.TERMII_API_KEY ||
  "TLnMfjVvHrTdaihJYhexOquvDQMESDSbRbwvVaVbBgsKxfQTJTMNEVWzBabrsf";
=======
const TERMII_API_KEY = process.env.TERMII_API_KEY;
// ||
// "TLnMfjVvHrTdaihJYhexOquvDQMESDSbRbwvVaVbBgsKxfQTJTMNEVWzBabrsf";
>>>>>>> 5a9ddf9 (feat: dashboard)

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
        from: "MyChurch", // senderId,
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
