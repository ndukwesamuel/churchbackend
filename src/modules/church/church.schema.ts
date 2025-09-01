import { z } from "zod";

export const churchSchema = z
  .object({
    pastorName: z
      .string({ required_error: "Username is required" })
      .min(2, "Username must be at least 2 characters long"),

    churchName: z
      .string({ required_error: "Fullname name is required" })
      .min(2, "Last name must be at least 2 characters long"),

    email: z
      .string({ required_error: "Email is required" })
      .email("Please provide a valid email address"),

    password: z
      .string({ required_error: "Password is required" })
      .min(8, "Password must be at least 8 characters long"),
  })
  .strict();
