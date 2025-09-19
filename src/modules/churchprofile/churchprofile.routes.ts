import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { ChurchProfileController } from "./churchprofile.controller.js";
import { isAuth } from "../../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get(isAuth, ChurchProfileController.getChurchProfile)
  .patch(isAuth, ChurchProfileController.updateChurchProfile)
  .all(methodNotAllowed);
router
  .route("/counts")
  .get(isAuth, ChurchProfileController.getChurchProfile)
  .all(methodNotAllowed);
router
  .route("/group")
  .post(isAuth, ChurchProfileController.createGroup)
  .all(methodNotAllowed);

router
  .route("/group")
  .post(isAuth, ChurchProfileController.createGroup)
  .all(methodNotAllowed);

export default router;
