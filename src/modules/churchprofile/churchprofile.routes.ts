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
import { churchSchema } from "../church/church.schema.js";

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
  .patch(
    isAuth,
    validateBody(churchSchema),
    ChurchProfileController.createGroup
  )
  .all(methodNotAllowed);

router
  .route("/group")
  .post(isAuth, ChurchProfileController.createGroup)
  .all(methodNotAllowed);

// router
//   .route("/signup")
//   .post(validateBody(churchSchema), AuthController.churchregister)
//   .all(methodNotAllowed);

// router
//   .route("/signin")
//   .post(validateBody(AuthSchemas.login), AuthController.login)
//   .all(methodNotAllowed);

// router
//   .route("/send-otp")
//   .post(validateBody(AuthSchemas.sendOTP), AuthController.sendOTP)
//   .all(methodNotAllowed);

// router
//   .route("/verify-otp")
//   .post(validateBody(AuthSchemas.verifyOTP), AuthController.verifyOTP)
//   .all(methodNotAllowed);

// router
//   .route("/forgot-password")
//   .post(validateBody(AuthSchemas.forgotPassword), AuthController.forgotPassword)
//   .all(methodNotAllowed);

// router
//   .route("/reset-password")
//   .post(validateBody(AuthSchemas.resetPassword), AuthController.resetPassword)
//   .all(methodNotAllowed);

export default router;
