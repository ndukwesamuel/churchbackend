import Agenda from "agenda";
import { env } from "../../config/env.config";
import { MessageService } from "../message/message.service";

export const agenda = new Agenda({
  db: { address: env.MONGODB_URI!, collection: "agendaJobs" },
});

// Define jobs
agenda.define("sendScheduledMessage", async (job: any) => {
  const { messageId } = job.attrs.data as { messageId: string };
  console.log(`⏰ Running scheduled job for message ${messageId}`);
  await MessageService.sendScheduledMessage(messageId);
});

export const AgendaScheduler = {
  async scheduleJob(messageId: string, scheduleAt: Date) {
    await agenda.schedule(scheduleAt, "sendScheduledMessage", { messageId });
  },
};
