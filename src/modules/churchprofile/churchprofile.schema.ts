import { z } from "zod";

export const churchprofileSchema = z
  .object({
    phoneNumber: z
      .string({ required_error: "Phone number is required" })
      .regex(
        /^(0)(7|8|9){1}(0|1){1}[0-9]{8}$/,
        "Please provide a valid Nigerian phone number"
      ),

    websiteLink: z
      .string({ required_error: "Email is required" })
      .email("Please provide a valid email address"),
    address: z
      .string({ required_error: "Email is required" })
      .email("Please provide a valid email address"),
  })
  .strict();

export const updateChurchProfileSchema = z.object({
  churchName: z
    .string({ required_error: "Church name is required" })
    .min(2, "Church name must be at least 2 characters long"),
  pastorName: z
    .string({ required_error: "Pastor name is required" })
    .min(2, "Pastor name must be at least 2 characters long"),
  phoneNumber: z
    .string({ required_error: "Phone number is required" })
    .regex(
      /^(0)(7|8|9){1}(0|1){1}[0-9]{8}$/,
      "Please provide a valid Nigerian phone number"
    ),
  websiteLink: z
    .string({ required_error: "Website link is required" })
    .url("Please provide a valid website URL"),
  address: z
    .string({ required_error: "Address is required" })
    .min(5, "Address must be at least 5 characters long"),
});
