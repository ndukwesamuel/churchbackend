import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { MessegingController } from "./message.controller.js";
import { isAuth } from "../../middleware/auth.js";
import MessageService from "./message.service.js";

const router = express.Router();

router;

router.get("/send-bulk-sms", async (req, res) => {
  try {
    let payload = {
      to: ["2349167703400", "2348065108162"],
      sms: "Hi there, testing Termii bulk send with hardcoded data.",
    };

    const result = await MessageService.sendBulkSMSV2(payload);

    // The result is an ApiSuccess object, which you can send back to the client
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      error: "An unexpected error occurred.",
      message: error.message,
    });
  }
});

// router.get("/send-bulk-whatapp", async (req, res) => {
//   try {
//     let payload = {
//       to: ["2349167703400", "2348065108162"],
//       sms: "Hi there, testing Termii bulk send with hardcoded data.",
//     };

//     const result = await MessageService.sendBulkWhatsApp(payload);

//     // The result is an ApiSuccess object, which you can send back to the client
//     res.status(200).json(result);
//   } catch (error) {
//     res.status(500).json({
//       error: "An unexpected error occurred.",
//       message: error.message,
//     });
//   }
// });

router.get("/send-bulk-whatsapp", async (req, res) => {
  try {
    let payload = {
      to: ["2349167703400", "2348065108162"],
      sms: "Hi there, testing Termii bulk send with hardcoded data.",
    };

    const result = await MessageService.sendBulkWhatsApp(payload);

    // The result is an ApiSuccess object, which you can send back to the client
    res.status(200).json(result);
  } catch (error) {
    // Check if the error is an instance of the custom ApiError class
    if (error instanceof ApiError) {
      // If it is, return the specific status code and data from the error object
      return res.status(error.statusCode).json({
        error: error.message,
        details: error.data,
      });
    }

    // For any other unexpected errors, return a generic 500 status
    res.status(500).json({
      error: "An unexpected error occurred.",
      message: error.message,
    });
  }
});

export default router;

// the session was wonderful  keep up the good work .
