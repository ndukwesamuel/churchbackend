import { z } from "zod";

export const CategorySchemas = {
  createCategorySchema: z.object({
    name: z.string().min(2),
    description: z.string().optional(),
  }),
  updateCategorySchema: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
};

export type CreateCategoryDTO = z.infer<
  typeof CategorySchemas.createCategorySchema
>;
export type UpdateCategoryDTO = z.infer<
  typeof CategorySchemas.updateCategorySchema
>;
