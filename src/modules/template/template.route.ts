import express from "express";
import { TemplateController } from "./template.controller";
import methodNotAllowed from "../../middleware/methodNotAllowed";
import { TemplateSchemas } from "./template.schema";
import { validateBody } from "../../middleware/validateSchema";
const router = express.Router();

router
  .route("/")
  .post(
    // validateBody(TemplateSchemas.createTemplateSchema),
    TemplateController.createTemplate
  )
  .get(TemplateController.getAllTemplates)
  .all(methodNotAllowed);

router
  .route("/search")
  .get(TemplateController.searchTemplates)
  .all(methodNotAllowed);

router
  .route("/channel/:channel")
  .get(TemplateController.getTemplatesByChannel)
  .all(methodNotAllowed);

router
  .route("/:id")
  .get(TemplateController.getTemplateById)
  .patch(
    validateBody(TemplateSchemas.updateTemplateSchema),
    TemplateController.updateTemplate
  )
  .delete(TemplateController.deleteTemplate)
  .all(methodNotAllowed);

export default router;
