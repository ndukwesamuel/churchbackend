import { z } from "zod";

export class GroupSchema {
  static createGroupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
  });

  static updateGroupSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
  });
}

export type ICreateGroup = z.infer<typeof GroupSchema.createGroupSchema>;
