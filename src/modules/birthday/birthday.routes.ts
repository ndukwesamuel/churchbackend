import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
// import { ContactsController } from "./contacts.controller.js";
import { isAuth } from "../../middleware/auth.js";
import { BirthDayController } from "./birthday.controller.js";
import { TemplateController } from "../template/template.controller.js";
const router = express.Router();

router
  .route("/")
  .get(isAuth, BirthDayController.getAllBirthday)
  // .post(isAuth, ContactsController.createContacts)
  .all(methodNotAllowed);

// router
// .route("/")
// .get(isAuth, BirthdayConfigController.getConfig)
// .post(isAuth, BirthdayConfigController.createOrUpdateConfig)
// .all(methodNotAllowed);
router
  .route("/template")
  .get(isAuth, TemplateController.getAllTemplates)
  .post(isAuth, BirthDayController.createOrUpdateConfig)

  // .post(isAuth, BirthdayConfigController.createOrUpdateConfig)
  .all(methodNotAllowed);

router
  .route("/templateConfig")
  // .get(isAuth, BirthDayController.getAllConfigs)
  .get(BirthDayController.getAllConfigs)
  .all(methodNotAllowed);

router
  .route("/sendmessage")
  // .get(isAuth, BirthDayController.getAllConfigs)
  .post(BirthDayController.sendTestBirthdayMessage)
  .all(methodNotAllowed);

router
  .route("/templateConfig/:configId")
  // .get(isAuth, BirthDayController.getAllConfigs)
  .delete(BirthDayController.deleteConfig)
  .all(methodNotAllowed);

// router
//   .route("/:id")
//   .delete(isAuth, ContactsController.deleteOneContact)
//   .patch(isAuth, ContactsController.updateContacts)
//   .all(methodNotAllowed);

// router
//   .route("/delete-all")
//   .delete(ContactsController.deleteAllContacts)
//   .all(methodNotAllowed);

export default router;
