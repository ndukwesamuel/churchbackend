import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
// import { ContactsController } from "./fileManger.controller.js";
import { isAuth } from "../../middleware/auth.js";
import { AdminController } from "./admin.controller.js";

const router = express.Router();

router
  .route("/makeCreation")
  .post(AdminController.Adminregister)
  .all(methodNotAllowed);

export default router;
