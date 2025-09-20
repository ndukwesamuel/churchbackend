import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { isAuth } from "../../middleware/auth.js";
import { MessegingController } from "./message.controller.js";
import MessageService from "./message.service.js";

const router = express.Router();

router
  .route("/")
  .get(isAuth, MessegingController.sendSmS)
  // .post(isAuth, ContactsController.createContacts)
  .all(methodNotAllowed);

router.post("/bulk", async (req, res) => {
  try {
    const response = await MessageService.sendBulkEmail(req.body);
    res.status(200).json(response);
  } catch (error: any) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to send bulk email",
    });
  }
});

export default router;

// the session was wonderful  keep up the good work .
