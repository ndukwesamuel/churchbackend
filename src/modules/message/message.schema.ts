// src/validation/message.schema.ts
import { z } from "zod";

function combineDateAndTime(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid scheduleDate");
  if (Number.isNaN(hours) || Number.isNaN(minutes))
    throw new Error("Invalid scheduleTime");
  date.setHours(hours!, minutes, 0, 0);
  return date;
}

export class MessageSchema {
  static createMessageSchema = z
    .object({
      message: z.string().min(1, "Message body is required"),
      messageType: z.enum(["sms", "whatsapp", "email"]),
      recipients: z
        .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Group ID"))
        .min(1, "At least one recipient group is required"),
      status: z
        .enum(["draft", "scheduled", "sent", "failed"])
        .optional()
        .default("draft"),

      // FE will send these two when scheduling
      scheduleDate: z.string().optional(),
      scheduleTime: z.string().optional(),

      description: z.string().max(2000).optional(),
    })
    .transform((data) => {
      // Convert scheduleDate + scheduleTime -> scheduleAt
      let scheduleAt: Date | undefined;
      if (data.scheduleDate && data.scheduleTime) {
        scheduleAt = combineDateAndTime(data.scheduleDate, data.scheduleTime);
      }

      return { ...data, scheduleAt };
    })
    .superRefine((data, ctx) => {
      const now = new Date();
      const status = data.status ?? "draft";

      if (status === "scheduled") {
        if (!data.scheduleAt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["scheduleDate"],
            message:
              "scheduleDate and scheduleTime are required when status = 'scheduled'",
          });
        } else if (data.scheduleAt <= now) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["scheduleAt"],
            message: "scheduleAt must be a future date/time",
          });
        }
      }

      if (status === "sent" && data.scheduleAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduleAt"],
          message: "scheduleAt must not be set when sending immediately",
        });
      }
    });
}
