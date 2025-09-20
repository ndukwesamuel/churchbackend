import express from "express";
import methodNotAllowed from "./middleware/methodNotAllowed";
import authRoutes from "./modules/auth/auth.routes";
import GroupRoutes from "./modules/group/group.routes";
import churchRoutes from "./modules/churchprofile/churchprofile.routes";
import contactsRoutes from "./modules/contacts/contacts.routes";
import FilesRoutes from "./modules/fileManger/fileManger.routes";
import AdminRoutes from "./modules/Admin/admin.routes";
import TemplateRoutes from "./modules/template/template.route";
import { isAuth } from "./middleware/auth";
import CategoryRoutes from "./modules/category/category.route";
import MessageRoutes from "./modules/message/message.route";
import mainMessageRoutes from "./modules/messgaing/message.routes";
import DashboardRoutes from "./modules/dashboard/dashboard.route";
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
router.use("/groups", isAuth, GroupRoutes);
router.use("/contacts", isAuth, contactsRoutes);
router.use("/collection", isAuth, FilesRoutes);
router.use("/templates", isAuth, TemplateRoutes);
router.use("/categories", isAuth, CategoryRoutes);
router.use("/messages", isAuth, MessageRoutes);
router.use("/main", mainMessageRoutes);
router.use("/dashboard", isAuth, DashboardRoutes);

export default router;
