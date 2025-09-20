import { z } from "zod";

export class channelConfigSchema {
  static createChannelConfigSchema = z.object({
    emailProvider: z.string({ required_error: "Email provider is required." }),
    fromEmail: z
      .string({ required_error: "Sender email is required." })
      .email("Please provide a valid email address"),
    apiKey: z.string({ required_error: " API key is required." }),
    isEnabled: z.boolean().default(true),
  });

  static updateChannelConfigSchema = z.object({
    emailProvider: z.string().optional(),
    fromEmail: z
      .string()
      .email("Please provide a valid email address")
      .optional(),
    apiKey: z.string().optional(),
    isEnabled: z.boolean(),
  });
}
