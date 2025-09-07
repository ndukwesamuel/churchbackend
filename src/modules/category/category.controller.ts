import type { Request, Response } from "express";
import { CategoryService } from "./category.service";
import type { AuthenticatedUser } from "../user/user.interface";
import { ApiError } from "../../utils/responseHandler";
import { CategorySchemas } from "./category.schema";

export class CategoryController {
  static async createCategory(req: Request, res: Response) {
    const parsed = CategorySchemas.createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw ApiError.badRequest("Invalid category payload");
    }

    const result = await CategoryService.createCategory(parsed.data);
    res.status(result.status_code).json(result);
  }

  static async getAllCategories(req: Request, res: Response) {
    const result = await CategoryService.getAllCategories();
    res.status(result.status_code).json(result);
  }

  static async getCategoryById(req: Request, res: Response) {
    const categoryId = req.params.id as string;

    const result = await CategoryService.getCategoryById(categoryId);
    res.status(result.status_code).json(result);
  }

  static async updateCategory(req: Request, res: Response) {
    const categoryId = req.params.id as string;

    const parsed = CategorySchemas.updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw ApiError.badRequest("Invalid category payload");
    }

    const result = await CategoryService.updateCategory(
      categoryId,
      parsed.data
    );
    res.status(result.status_code).json(result);
  }

  static async deleteCategory(req: Request, res: Response) {
    const categoryId = req.params.id as string;

    const result = await CategoryService.deleteCategory(categoryId);
    res.status(result.status_code).json(result);
  }

  /**
   * Returns all categories + how many templates fall under each
   */
  static async getCategoryStats(req: Request, res: Response) {
    const result = await CategoryService.getCategoryStats();
    res.status(result.status_code).json(result);
  }
}
