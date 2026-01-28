import express, { type Request, type Response } from "express";
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
import BirthdayRoutes from "./modules/birthday/birthday.routes";
import EventRoutes from "./modules/event/event.routes";
import sendEmail, { sendBulkEmail_Brevo } from "./utils/email";
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

router.get("/test", async (req: Request, res: Response) => {
  try {
    const recipients = [
      "kenechukwuokoh30@gmail.com",
      "ndukwesamuel23@gmail.com",
      // Add more emails as needed
    ];

    const emailSubject = "Bulk Test Email from Church";
    const emailText = "This is a bulk test email";
    const emailHtml =
      "<h1>This is a bulk test email</h1><p>Bulk email is working!</p>";

    const result = await sendBulkEmail_Brevo({
      to: recipients,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    });

    return res.status(200).json({
      success: true,
      message: "Bulk email process completed",
      data: result,
    });
  } catch (error: any) {
    console.error("Error in bulk test email route:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send bulk email",
      error: error.message,
    });
  }
});
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
router.use("/birthday", isAuth, BirthdayRoutes);
router.use("/birthday", isAuth, BirthdayRoutes);
router.use("/event", EventRoutes);

export default router;
