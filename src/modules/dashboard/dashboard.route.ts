import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { isAuth } from "../../middleware/auth.js";
import { DashboardController } from "./dashboard.controller.js";
const router = express.Router();

router
  .route("/")
  .get(isAuth, DashboardController.getAllStats)
  .all(methodNotAllowed);

export default router;
