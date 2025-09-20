import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { MessegingController } from "./message.controller.js";
import { isAuth } from "../../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get(isAuth, MessegingController.sendSmS)
  // .post(isAuth, ContactsController.createContacts)
  .all(methodNotAllowed);

export default router;


// the session was wonderful  keep up the good work .