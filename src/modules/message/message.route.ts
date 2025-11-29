import express from "express";
import { MessageController } from "./message.controller";
import { MessageSchema } from "./message.schema";
import { validateBody } from "../../middleware/validateSchema";
const router = express.Router();

router
  .route("/")
  .post(
    validateBody(MessageSchema.createMessageSchema),
    MessageController.createMessage
  )
  .get(MessageController.getMessages);

router
  .route("/fas")

  .get(MessageController.GetAllBAD);

router
  .route("/:id")
  .get(MessageController.getMessageById)
  .put(MessageController.updateMessage)
  .delete(MessageController.deleteMessage);

export default router;
