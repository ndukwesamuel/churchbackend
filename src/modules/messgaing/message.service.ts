import https from "https";
import { ApiError, ApiSuccess } from "../../utils/responseHandler"; // Assuming you have these utilities
import { env } from "../../config/env.config";
import { log } from "console";
import { sendBulkEmail_Brevo } from "../../utils/email";

// --- Termii API Configuration ---
const HOSTNAME = "api.ng.termii.com";
const BULK_SMS_PATH = "/api/sms/send/bulk";
const WHATSAPP_PATH = "/api/sms/send";

const RESEND_HOSTNAME = "api.resend.com";
const RESEND_PATH = "/emails";

interface ITermiiBulkPayload {
  to: string | string[]; // Can be a single number or an array
  api_key?: string;
  from?: string; // Sender ID
  sms: string; // The message content
  type?: "plain" | "unicode"; // Message type
  channel?: "dnd" | "generic" | "whatsapp"; // Message channel
}
export interface IResendBulkPayload {
  from: string; // e.g. "Kitovu Support <onboarding@resend.dev>"
  to: string[]; // list of recipients (max 50)
  subject: string;
  html: string;
}

class MessageService {
  // Validates if a phone number is properly formatted for Nigerian numbers
  // private static isValidNigerianPhone(phone: string): boolean {
  //   // Valid formats:
  //   // +2348XXXXXXXXX (13 chars total)
  //   // 08XXXXXXXXX (11 chars total)
  //   if (phone.startsWith("+234") && phone.length === 13) {
  //     return true;
  //   }
  //   if (phone.startsWith("0") && phone.length === 11) {
  //     return true;
  //   }
  //   return false;
  // }
  private static isValidNigerianPhone(phone: string): boolean {
    // Valid formats:
    // +234XXXXXXXXXX (14 chars: + plus 234 plus 10 digits)
    // 234XXXXXXXXXX (13 chars: 234 plus 10 digits)
    // 0XXXXXXXXXX (11 chars: 0 plus 10 digits)

    if (phone.startsWith("+234") && phone.length === 14) {
      return true;
    }
    if (phone.startsWith("234") && phone.length === 13) {
      return true;
    }
    if (phone.startsWith("0") && phone.length === 11) {
      return true;
    }
    return false;
  }

  // Splits an array into smaller arrays of a given size
  private static chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Sends a single chunk (max 100) to Termii
  private static sendSingleChunk(to: string[], sms: string): Promise<any> {
    const maindata = {
      api_key: env.TERMII_API_KEY,
      to: to.map((number) => number.replace("+", "")), // strip + before sending to Termii
      from: "CHURCHSMS",
      sms,
      type: "plain",
      channel: "generic",
    };
    const termiiPayload = JSON.stringify(maindata);
    const options = {
      hostname: HOSTNAME,
      port: 443,
      path: BULK_SMS_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(termiiPayload, "utf8"),
      },
    };

    return new Promise((resolve, reject) => {
      const apiReq = https.request(options, (apiRes) => {
        let data = "";

        apiRes.on("data", (chunk) => {
          data += chunk;
        });

        apiRes.on("end", () => {
          try {
            const termiiResponse = JSON.parse(data);

            if (apiRes.statusCode && apiRes.statusCode >= 400) {
              return reject(
                ApiError.internalServerError(
                  `Termii API Error (${apiRes.statusCode}): ${
                    termiiResponse.message || "Bulk SMS failed."
                  }`,
                ),
              );
            }

            return resolve(termiiResponse);
          } catch (e) {
            if (apiRes.statusCode && apiRes.statusCode >= 400) {
              return reject(
                ApiError.internalServerError(
                  `Termii API Error (${apiRes.statusCode}): ${data}`,
                ),
              );
            }

            return reject(
              ApiError.internalServerError(
                `Failed to parse Termii response: ${data}`,
              ),
            );
          }
        });
      });

      apiReq.on("error", (e) => {
        console.error(`Problem with Termii request: ${e.message}`);
        return reject(
          ApiError.internalServerError(
            "Failed to connect to the external messaging API.",
          ),
        );
      });

      apiReq.write(termiiPayload);
      apiReq.end();
    });
  }

  // Main function — filters bad numbers, chunks recipients, sends each chunk
  static async sendBulkSMSV2(
    payload: ITermiiBulkPayload,
    startFromChunk: number = 1, // default to chunk 1 if not specified
  ) {
    console.log("Sending bulk SMS via Termii with payload:", payload);

    // STEP 1: Filter out invalid phone numbers
    const invalidNumbers: string[] = [];
    const validNumbers = payload.to.filter((phone) => {
      const isValid = this.isValidNigerianPhone(phone);
      if (!isValid) {
        invalidNumbers.push(phone);
      }
      return isValid;
    });

    if (invalidNumbers.length > 0) {
      console.log(
        `⚠️  Filtered out ${invalidNumbers.length} invalid phone numbers:`,
        invalidNumbers,
      );
    }

    if (validNumbers.length === 0) {
      return ApiError.badRequest("No valid phone numbers to send to");
    }

    // STEP 2: Chunk the valid numbers
    const CHUNK_SIZE = 100;
    const chunks = this.chunkArray(validNumbers, CHUNK_SIZE);
    const allResponses: any[] = [];

    console.log(
      `Total valid recipients: ${validNumbers.length} | Splitting into ${chunks.length} chunks | Starting from chunk ${startFromChunk}`,
    );

    // STEP 3: Send each chunk starting from the specified chunk
    for (let i = startFromChunk - 1; i < chunks.length; i++) {
      console.log(
        `Sending chunk ${i + 1} of ${chunks.length} (${chunks[i].length} recipients)`,
      );

      const response = await this.sendSingleChunk(chunks[i], payload.sms);
      allResponses.push(response);

      console.log(`Chunk ${i + 1} sent successfully`);
    }

    return ApiSuccess.ok("Bulk SMS sent successfully", {
      totalChunks: chunks.length,
      totalRecipients: validNumbers.length,
      invalidNumbers: invalidNumbers.length,
      sentChunks: chunks.length - (startFromChunk - 1),
      startedFromChunk: startFromChunk,
      responses: allResponses,
    });
  }

  static async sendBulkWhatsApp(payload: ITermiiBulkPayload) {
    const maindata = {
      api_key: env.TERMII_API_KEY,
      // to: payload.to,
      // to: ["2349167703400", "2349125778176"], //"2348065108162"],

      from: "CHURCHSMS", // The Sender ID for your WhatsApp account
      sms: payload.sms,
      type: "plain",
      channel: "whatsapp",
    };
    const termiiPayload = JSON.stringify(maindata);

    const options = {
      hostname: HOSTNAME,
      port: 443,
      path: WHATSAPP_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Content-Length": termiiPayload.length,
        "Content-Length": Buffer.byteLength(termiiPayload, "utf8"),
      },
    };

    return new Promise((resolve, reject) => {
      const apiReq = https.request(options, (apiRes) => {
        let data = "";
        apiRes.on("data", (chunk) => {
          data += chunk;
        });

        apiRes.on("end", () => {
          try {
            const termiiResponse = JSON.parse(data);
            if (apiRes.statusCode && apiRes.statusCode >= 400) {
              return reject(
                ApiError.internalServerError(
                  `Termii API Error (${apiRes.statusCode}): ${
                    termiiResponse.message || "Bulk WhatsApp message failed."
                  }`,
                ),
              );
            }
            return resolve(
              ApiSuccess.ok(
                "Bulk WhatsApp messages sent successfully",
                termiiResponse,
              ),
            );
          } catch (e) {
            return reject(
              ApiError.internalServerError(
                "Failed to parse response from Termii API.",
              ),
            );
          }
        });
      });

      apiReq.on("error", (e) => {
        console.error(`Problem with Termii request: ${e.message}`);
        return reject(
          ApiError.internalServerError(
            "Failed to connect to the external messaging API.",
          ),
        );
      });

      apiReq.write(termiiPayload);
      apiReq.end();
    });
  }

  static async sendBulkWhatsEmail(payload: ITermiiBulkPayload) {
    const maindata = {
      api_key: env.TERMII_API_KEY,
      to: payload.to,

      from: "CHURCHSMS", // The Sender ID for your WhatsApp account
      sms: payload.sms,
      type: "plain",
      channel: "whatsapp",
    };
    const termiiPayload = JSON.stringify(maindata);

    const options = {
      hostname: HOSTNAME,
      port: 443,
      path: WHATSAPP_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": termiiPayload.length,
      },
    };

    return new Promise((resolve, reject) => {
      const apiReq = https.request(options, (apiRes) => {
        let data = "";
        apiRes.on("data", (chunk) => {
          data += chunk;
        });

        apiRes.on("end", () => {
          try {
            const termiiResponse = JSON.parse(data);
            if (apiRes.statusCode && apiRes.statusCode >= 400) {
              return reject(
                ApiError.internalServerError(
                  `Termii API Error (${apiRes.statusCode}): ${
                    termiiResponse.message || "Bulk WhatsApp message failed."
                  }`,
                ),
              );
            }
            return resolve(
              ApiSuccess.ok(
                "Bulk WhatsApp messages sent successfully",
                termiiResponse,
              ),
            );
          } catch (e) {
            return reject(
              ApiError.internalServerError(
                "Failed to parse response from Termii API.",
              ),
            );
          }
        });
      });

      apiReq.on("error", (e) => {
        console.error(`Problem with Termii request: ${e.message}`);
        return reject(
          ApiError.internalServerError(
            "Failed to connect to the external messaging API.",
          ),
        );
      });

      apiReq.write(termiiPayload);
      apiReq.end();
    });
  }

  // static async sendBulkEmail(payload: IResendBulkPayload) {
  //   // if (!env.RESEND_API_KEY) {
  //   //   return ApiError.internalServerError("RESEND_API_KEY is not set.");
  //   // }

  //   const postData = JSON.stringify({
  //     from: "Kitovu Support <onboarding@resend.dev>",
  //     // from:payload.from,
  //     to: ["ndukwesamuel23@gmail.com"], //payload.to,
  //     subject: payload.subject,
  //     html: payload.html,
  //   });

  //   const options = {
  //     hostname: RESEND_HOSTNAME,
  //     port: 443,
  //     path: RESEND_PATH,
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${env.RESEND_API_KEY}`,
  //       "Content-Length": Buffer.byteLength(postData),
  //     },
  //   };

  //   return new Promise((resolve, reject) => {
  //     const req = https.request(options, (res) => {
  //       let data = "";

  //       res.on("data", (chunk) => {
  //         data += chunk;
  //       });

  //       res.on("end", () => {
  //         try {
  //           const resendResponse = JSON.parse(data);

  //           if (res.statusCode && res.statusCode >= 400) {
  //             return reject(
  //               ApiError.internalServerError(
  //                 `Resend API Error (${res.statusCode}): ${
  //                   resendResponse.message || "Bulk email failed."
  //                 }`
  //               )
  //             );
  //           }

  //           return resolve(
  //             ApiSuccess.ok(
  //               `Bulk email successfully queued for ${payload.to.length} recipients.`,
  //               resendResponse
  //             )
  //           );
  //         } catch (err) {
  //           return reject(
  //             ApiError.internalServerError(
  //               "Failed to parse response from Resend API."
  //             )
  //           );
  //         }
  //       });
  //     });

  //     req.on("error", (e) => {
  //       console.error(`Problem with Resend request: ${e.message}`);
  //       return reject(
  //         ApiError.internalServerError(
  //           "Failed to connect to the Resend API service."
  //         )
  //       );
  //     });

  //     req.write(postData);
  //     req.end();
  //   });
  // }

  static async sendBulkEmail(payload: IResendBulkPayload) {
    const emailSubject = payload.subject; //"Bulk Test Email from Church";
    const emailHtml = payload.html;
    const recipients = payload.to;
    const emailText = payload.subject;

    const result = await sendBulkEmail_Brevo({
      to: recipients,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    return result;
  }
}

export default MessageService;
