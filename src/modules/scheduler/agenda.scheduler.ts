// src/schedulers/agenda.scheduler.ts
import Agenda from "agenda";

const agenda = new Agenda({ db: { address: process.env.MONGO_URI! } });

// Register job (to be defined in a worker)
agenda.define("sendScheduledMessage", async (job: any) => {
  const { messageId } = job.attrs.data;
  console.log(`⏰ Running scheduled job for message ${messageId}`);
  // Here you'd call MessageService.sendScheduledMessage(messageId)
});

export const AgendaScheduler = {
  async scheduleJob(messageId: string, scheduleAt: Date) {
    await agenda.start();
    await agenda.schedule(scheduleAt, "sendScheduledMessage", { messageId });
  },
};
