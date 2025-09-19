import express from "express";
import methodNotAllowed from "./middleware/methodNotAllowed";
import authRoutes from "./modules/auth/auth.routes";
import churchRoutes from "./modules/churchprofile/churchprofile.routes";
import contactsRoutes from "./modules/contacts/contacts.routes";
import FilesRoutes from "./modules/fileManger/fileManger.routes";
import AdminRoutes from "./modules/Admin/admin.routes";
import TemplateRoutes from "./modules/template/template.route";
import { isAuth } from "./middleware/auth";
import CategoryRoutes from "./modules/category/category.route";
import MessegingRoutes from "./modules/messgaing/message.routes";
// import methodNotAllowed from "../../middleware/methodNotAllowed.js";
// import { AuthController } from "./auth.controller.js";
// import { isAuth } from "../../middleware/auth.js";
// import { userSchema } from "../user/user.schema.js";
// import { AuthSchemas } from "./auth.schema.js";
// import { validateBody } from "../../middleware/validateSchema.js";

const router = express.Router();

router
  .route("/")
  .get((req, res) => {
    res.status(200).json({
      status: "success",
      message: "Welcome to the API",
    });
  })
  .all(methodNotAllowed);

router.use("/admin", AdminRoutes);
router.use("/auth", authRoutes);
router.use("/setting", churchRoutes);
router.use("/contacts", isAuth, contactsRoutes);
router.use("/collection", isAuth, FilesRoutes);
router.use("/templates", isAuth, TemplateRoutes);
router.use("/categories", isAuth, CategoryRoutes);
router.use("/messging", MessegingRoutes);

// router.route("/").get(isAuth, AuthController.getUser).all(methodNotAllowed);

// router
//   .route("/signup")
//   .post(validateBody(userSchema), AuthController.register)
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
