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
      status: z.enum(["draft", "scheduled", "sent", "failed"]),
      scheduleAt: z.coerce.date().optional(),
      description: z.string().max(2000).optional(),
    })
    .superRefine((data, ctx) => {
      const now = new Date();

      if (data.status === "scheduled") {
        if (!data.scheduleAt) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["scheduleAt"],
            message: "scheduleAt is required when status = 'scheduled'",
          });
        } else if (data.scheduleAt <= now) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["scheduleAt"],
            message: "scheduleAt must be in the future",
          });
        }
      }

      if (data.status === "sent" && data.scheduleAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduleAt"],
          message: "scheduleAt must not be set when sending immediately",
        });
      }
    });
}
