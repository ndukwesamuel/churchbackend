import https from "https";
import { ApiError, ApiSuccess } from "../../utils/responseHandler"; // Assuming you have these utilities
import { env } from "../../config/env.config";
import { log } from "console";

// --- Termii API Configuration ---
const HOSTNAME = "api.ng.termii.com";
const BULK_SMS_PATH = "/api/sms/send/bulk";
const WHATSAPP_PATH = "/api/sms/send";

// --- Termii Payload Interface (for better type safety) ---
interface ITermiiBulkPayload {
  api_key: string;
  // to: string[]; // Array of phone numbers
  to: string | string[]; // Can be a single number or an array
  from: string; // Sender ID
  // api_key?: string;
  // to: string[]; // Array of phone numbers
  // from?: string; // Sender ID
  sms: string; // The message content
  type?: "plain" | "unicode"; // Message type
  channel?: "dnd" | "generic" | "whatsapp"; // Message channel
}

class MessageService {
  static async sendBulkSMSV2(payload: ITermiiBulkPayload) {
    console.log(payload);
    console.log(payload.to);

    const maindata = {
      api_key: env.TERMII_API_KEY,
      to: payload.to,
      from: "CHURCHSMS",
      sms: payload.sms, //"Hi there, testing Termii bulk send with the new service structure.",
      type: "plain",
      channel: "generic",
    };
    const termiiPayload = JSON.stringify(maindata);
    const options = {
      hostname: HOSTNAME,
      port: 443, // Default HTTPS port
      path: BULK_SMS_PATH,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": termiiPayload.length,
      },
    };

    return new Promise((resolve, reject) => {
      const apiReq = https.request(options, (apiRes) => {
        let data = "";

        // Collect the response data from Termii
        apiRes.on("data", (chunk) => {
          data += chunk;
        });

        // Termii response received
        apiRes.on("end", () => {
          try {
            const termiiResponse = JSON.parse(data);

            // Check if Termii returned a non-success status code (e.g., 400, 500)
            if (apiRes.statusCode && apiRes.statusCode >= 400) {
              // Reject with an ApiError if the Termii API indicates a failure
              return reject(
                ApiError.internal(
                  `Termii API Error (${apiRes.statusCode}): ${
                    termiiResponse.message || "Bulk SMS failed."
                  }`,
                  termiiResponse
                )
              );
            }

            // Resolve with a success response wrapper
            return resolve(
              ApiSuccess.ok("Bulk SMS sent successfully", termiiResponse)
            );
          } catch (e) {
            // Handle JSON parsing error from Termii
            return reject(
              ApiError.internal("Failed to parse response from Termii API.")
            );
          }
        });
      });

      // Handle network errors (e.g., DNS failure, connection refused)
      apiReq.on("error", (e) => {
        console.error(`Problem with Termii request: ${e.message}`);
        return reject(
          ApiError.internal(
            "Failed to connect to the external messaging API.",
            { details: e.message }
          )
        );
      });

      // Write the payload to the request body and send the request
      apiReq.write(termiiPayload);
      apiReq.end();
    });
  }

  // static async sendBulkWhatsApp(
  //   payload: Omit<ITermiiBulkPayload, "channel"> & { channel: "whatsapp" }
  // ) {
  //   const maindata = {
  //     api_key: env.TERMII_API_KEY,
  //     to: payload.to,
  //     from: "CHURCHSMS", // The Sender ID for your WhatsApp account
  //     sms: payload.sms,
  //     type: "plain",
  //     channel: "whatsapp",
  //   };
  //   const termiiPayload = JSON.stringify(maindata);

  //   const options = {
  //     hostname: HOSTNAME,
  //     port: 443,
  //     path: WHATSAPP_PATH,
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "Content-Length": termiiPayload.length,
  //     },
  //   };

  //   return new Promise((resolve, reject) => {
  //     const apiReq = https.request(options, (apiRes) => {
  //       let data = "";
  //       apiRes.on("data", (chunk) => {
  //         data += chunk;
  //       });

  //       apiRes.on("end", () => {
  //         try {
  //           const termiiResponse = JSON.parse(data);
  //           if (apiRes.statusCode && apiRes.statusCode >= 400) {
  //             return reject(
  //               ApiError.internal(
  //                 `Termii API Error (${apiRes.statusCode}): ${
  //                   termiiResponse.message || "Bulk WhatsApp message failed."
  //                 }`,
  //                 termiiResponse
  //               )
  //             );
  //           }
  //           return resolve(
  //             ApiSuccess.ok(
  //               "Bulk WhatsApp messages sent successfully",
  //               termiiResponse
  //             )
  //           );
  //         } catch (e) {
  //           return reject(
  //             ApiError.internal("Failed to parse response from Termii API.")
  //           );
  //         }
  //       });
  //     });

  //     apiReq.on("error", (e) => {
  //       console.error(`Problem with Termii request: ${e.message}`);
  //       return reject(
  //         ApiError.internal(
  //           "Failed to connect to the external messaging API.",
  //           { details: e.message }
  //         )
  //       );
  //     });

  //     apiReq.write(termiiPayload);
  //     apiReq.end();
  //   });
  // }
  // static async sendBulkWhatsApp(
  //   payload: Omit<ITermiiBulkPayload, "channel"> & { channel: "whatsapp" }
  // ) {
  //   const maindata = {
  //     api_key: env.TERMII_API_KEY,
  //     to: payload.to,
  //     from: "CHURCHSMS", // The Sender ID for your WhatsApp account
  //     sms: payload.sms,
  //     type: "plain",
  //     channel: "whatsapp",
  //   };
  //   const termiiPayload = JSON.stringify(maindata);

  //   const options = {
  //     hostname: HOSTNAME,
  //     port: 443,
  //     path: WHATSAPP_PATH,
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "Content-Length": termiiPayload.length,
  //     },
  //   };

  //   return new Promise((resolve, reject) => {
  //     const apiReq = https.request(options, (apiRes) => {
  //       let data = "";
  //       apiRes.on("data", (chunk) => {
  //         data += chunk;
  //       });

  //       apiRes.on("end", () => {
  //         try {
  //           const termiiResponse = JSON.parse(data);
  //           if (apiRes.statusCode && apiRes.statusCode >= 400) {
  //             return reject(
  //               ApiError.internal(
  //                 `Termii API Error (${apiRes.statusCode}): ${
  //                   termiiResponse.message || "Bulk WhatsApp message failed."
  //                 }`,
  //                 termiiResponse
  //               )
  //             );
  //           }
  //           // Corrected line: pass termiiResponse to ApiSuccess.ok()
  //           return resolve(
  //             ApiSuccess.ok(
  //               "Bulk WhatsApp messages sent successfully",
  //               termiiResponse
  //             )
  //           );
  //         } catch (e) {
  //           return reject(
  //             ApiError.internal("Failed to parse response from Termii API.")
  //           );
  //         }
  //       });
  //     });

  //     apiReq.on("error", (e) => {
  //       console.error(`Problem with Termii request: ${e.message}`);
  //       return reject(
  //         ApiError.internal(
  //           "Failed to connect to the external messaging API.",
  //           { details: e.message }
  //         )
  //       );
  //     });

  //     apiReq.write(termiiPayload);
  //     apiReq.end();
  //   });
  // }

  static async sendBulkWhatsApp(
    payload: Omit<ITermiiBulkPayload, "channel"> & { channel: "whatsapp" }
  ) {
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
                  }`
                )
              );
            }
            return resolve(
              ApiSuccess.ok(
                "Bulk WhatsApp messages sent successfully",
                termiiResponse
              )
            );
          } catch (e) {
            return reject(
              ApiError.internalServerError(
                "Failed to parse response from Termii API."
              )
            );
          }
        });
      });

      apiReq.on("error", (e) => {
        console.error(`Problem with Termii request: ${e.message}`);
        return reject(
          ApiError.internalServerError(
            "Failed to connect to the external messaging API."
          )
        );
      });

      apiReq.write(termiiPayload);
      apiReq.end();
    });
  }
}

export default MessageService;
