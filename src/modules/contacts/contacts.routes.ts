import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
import { ContactsController } from "./contacts.controller.js";
import { isAuth } from "../../middleware/auth.js";
const router = express.Router();

router
  .route("/")
  .get(isAuth, ContactsController.getChurchContact)
  .post(isAuth, ContactsController.createContacts)
  .all(methodNotAllowed);

router
  .route("/bulk")
  // .get(isAuth, ContactsController.getChurchContact)
  .post(isAuth, ContactsController.bulkCreateContacts)
  .all(methodNotAllowed);

router
  .route("/:id")
  .delete(isAuth, ContactsController.deleteOneContact)
  .patch(isAuth, ContactsController.updateContacts)
  .all(methodNotAllowed);

router
  .route("/delete-all")
  .delete(ContactsController.deleteAllContacts)
  .all(methodNotAllowed);

export default router;
