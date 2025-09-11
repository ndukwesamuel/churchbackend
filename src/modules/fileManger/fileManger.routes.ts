import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
// import { ContactsController } from "./fileManger.controller.js";
import { isAuth } from "../../middleware/auth.js";
import { fileMangerController } from "./fileManger.controller.js";

const router = express.Router();

// router
//   .route("/")
//   .get((req, res) => {
//     res.status(200).json({
//       status: "success",
//       message: "Welcome to the API contact",
//     });
//   })
//   .all(methodNotAllowed);

router
  .route("/")
  .post(fileMangerController.createFileManager)
  .get(fileMangerController.GetAllFileManager)
  .all(methodNotAllowed);

router
  .route("/add-folder")
  .post(fileMangerController.createFolders)
  // .post(ContactsController.createContacts)
  .all(methodNotAllowed);

router
  .route("/add-fileToFolder")
  .post(fileMangerController.AddFileToFolders)
  .patch(fileMangerController.AddFileToFoldersSingle)
  // .post(ContactsController.createContacts)
  .all(methodNotAllowed);

export default router;
