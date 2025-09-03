import { z } from "zod";
export class TemplateSchemas {
  static variableSchema = z.object({
    placeholder: z.string().optional(),
  });

  static createTemplateSchema = z.object({
    name: z.string().min(1, "Template name is required").trim(),
    channels: z
      .array(z.enum(["email", "whatsapp", "sms"]))
      .min(1, "At least one channel is required"),
    content: z.string().min(1, "Content is required"),
    category: z.string().min(1, "Category is required"),
    note: z.string().optional(),
    variables: z.array(this.variableSchema).optional().default([]),
  });

  // Update template schema (all fields optional except user)
  static updateTemplateSchema = z.object({
    name: z.string().min(1, "Template name is required").trim().optional(),
    channels: z
      .array(z.enum(["email", "whatsapp", "sms"]))
      .min(1, "At least one channel is required")
      .optional(),
    content: z.string().min(1, "Content is required").optional(),
    category: z.string().min(1, "Category is required"),

    note: z.string().optional(),
    variables: z.array(this.variableSchema).optional().default([]),
  });
  static getTemplatesQuerySchema = z.object({
    page: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1))
      .optional()
      .default("1"),
    limit: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1).max(100))
      .optional()
      .default("10"),
    search: z.string().optional(),
    channel: z.enum(["email", "whatsapp", "sms"]).optional(),
    sortBy: z
      .enum(["name", "createdAt", "updatedAt"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  });
}

// MongoDB ObjectId validation
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format");

export type CreateTemplateDTO = z.infer<
  typeof TemplateSchemas.createTemplateSchema
>;
export type UpdateTemplateDTO = z.infer<
  typeof TemplateSchemas.updateTemplateSchema
>;
export type GetTemplatesQueryDTO = z.infer<
  typeof TemplateSchemas.getTemplatesQuerySchema
>;
export type TemplateVariable = z.infer<typeof TemplateSchemas.variableSchema>;
