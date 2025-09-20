import express from "express";
import methodNotAllowed from "../../middleware/methodNotAllowed.js";
// import { ContactsController } from "./fileManger.controller.js";
import { isAuth } from "../../middleware/auth.js";

const router = express.Router();

router
  .route("/")
  .get((req, res) => {
    res.status(200).json({
      status: "success",
      message: "Welcome to the API contact",
    });
  })
  .all(methodNotAllowed);

export default router;
