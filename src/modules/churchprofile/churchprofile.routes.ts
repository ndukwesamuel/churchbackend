import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import {
  // AuthController,
  ChurchProfileController,
} from "./churchprofile.controller.js";
import { isAuth } from "../../middleware/auth.js";
import { userSchema } from "../user/user.schema.js";
// import { AuthSchemas } from "./auth.schema.js";
import { validateBody } from "../../middleware/validateSchema.js";

const router = express.Router();

// router
//   .route("/")
//   .get((req, res) => {
//     res.status(200).json({
//       status: "success",
//       message: "Welcome to the API login",
//     });
//   })
//   .all(methodNotAllowed);

router
  .route("/")
  .get(isAuth, ChurchProfileController.getChurchProfile)
  .patch(isAuth, ChurchProfileController.updateChurchProfile)
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
