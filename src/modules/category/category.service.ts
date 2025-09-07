import { ApiSuccess, ApiError } from "../../utils/responseHandler";
import type { CreateCategoryDTO, UpdateCategoryDTO } from "./category.schema";
import { Category } from "./category.model";
import { Template } from "../template/template.model";

export class CategoryService {
  static async createCategory(categoryData: CreateCategoryDTO) {
    const { name, description } = categoryData;

    const existing = await Category.findOne({ name });
    if (existing) {
      throw ApiError.badRequest("Category already exists");
    }

    const category = await Category.create({
      name,
      description,
    });

    return ApiSuccess.created("Category created successfully", category);
  }

  static async getAllCategories() {
    const categories = await Category.find().lean();
    return ApiSuccess.ok("Categories retrieved successfully", categories);
  }

  static async getCategoryById(categoryId: string) {
    const category = await Category.findOne({
      _id: categoryId,
    }).lean();

    if (!category) {
      throw ApiError.notFound("Category not found");
    }

    return ApiSuccess.ok("Category retrieved successfully", category);
  }

  static async updateCategory(
    categoryId: string,
    updateData: UpdateCategoryDTO
  ) {
    const category = await Category.findOneAndUpdate(
      { _id: categoryId },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
        lean: true,
      }
    );

    if (!category) {
      throw ApiError.notFound("Category not found");
    }

    return ApiSuccess.ok("Category updated successfully", category);
  }

  static async deleteCategory(categoryId: string) {
    const category = await Category.findOneAndDelete({
      _id: categoryId,
    });

    if (!category) {
      throw ApiError.notFound("Category not found");
    }

    return ApiSuccess.ok("Category deleted successfully");
  }

  static async getCategoryStats() {
    const stats = await Template.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $project: {
          _id: 0,
          categoryId: "$category._id",
          name: "$category.name",
          icon: "$category.icon",
          count: 1,
        },
      },
    ]);

    return ApiSuccess.ok("Category stats retrieved successfully", stats);
  }
}
