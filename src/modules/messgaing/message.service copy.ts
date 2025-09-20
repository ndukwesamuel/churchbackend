import { ApiError, ApiSuccess } from "../../utils/responseHandler";
import axios from "axios";

const TERMII_BASE_URL =
  process.env.TERMII_BASE_URL || "https://api.ng.termii.com/api/sms/send";
const TERMII_API_KEY = process.env.TERMII_API_KEY;
// ||
// "TLnMfjVvHrTdaihJYhexOquvDQMESDSbRbwvVaVbBgsKxfQTJTMNEVWzBabrsf";

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

  HOSTNAME = "api.ng.termii.com"; // Corrected: The hostname only
  BULK_SMS_PATH = "/api/sms/send/bulk";

  // --- Hardcoded Test Data ---
  TEST_API_KEY =
    "TLnMfjVvHrTdaihJYhexOquvDQMESDSbRbwvVaVbBgsKxfQTJTMNEVWzBabrsf"; // REPLACE with a real key
  TEST_TO = ["2349167703400", "2348065108162"];
  TEST_FROM = "CHURCHSMS";
  TEST_SMS = "Hi there, testing Termii bulk send with hardcoded data.";
  TEST_TYPE = "plain";
  TEST_CHANNEL = "generic";

  static async sendBulkSMSV2(recipients, senderId, message) {
    try {
      const response = await axios.post(TERMII_BULK_SMS_URL, {
        api_key: TERMII_API_KEY,
        // The API documentation for bulk send requires the 'to' parameter to be an array of strings,
        // not a comma-separated string like the single-send endpoint might.
        // Your first code block was incorrect with recipients.join(","). The bulk API needs an array.
        to: recipients,
        from: senderId,
        sms: message,
        type: "plain",
        channel: "generic",
      });

      return ApiSuccess.ok("SMS sent successfully", response.data);
    } catch (error: any) {
      throw ApiError.badRequest(error.response?.data || error.message);
    }
  }

  // Install axios if you haven't already: npm install axios
}

export default MessageService;
