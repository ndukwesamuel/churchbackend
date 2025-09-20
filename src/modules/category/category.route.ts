import express from "express";
import { CategoryController } from "./category.controller";
import methodNotAllowed from "../../middleware/methodNotAllowed";
import { CategorySchemas } from "./category.schema";
import { validateBody } from "../../middleware/validateSchema";

const router = express.Router();

router
  .route("/")
  .post(
    validateBody(CategorySchemas.createCategorySchema),
    CategoryController.createCategory
  )
  .get(CategoryController.getAllCategories)
  .all(methodNotAllowed);

router
  .route("/:id")
  .get(CategoryController.getCategoryById)
  .patch(
    validateBody(CategorySchemas.updateCategorySchema),
    CategoryController.updateCategory
  )
  .delete(CategoryController.deleteCategory)
  .all(methodNotAllowed);

router
  .route("/stats/counts")
  .get(CategoryController.getCategoryStats)
  .all(methodNotAllowed);

export default router;
