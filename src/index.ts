import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import "dotenv/config";
import logger from "./utils/logger";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.config";
import connectDB from "./config/connectDB";
import notFound from "./middleware/notFound";
import authRoutes from "./modules/auth/auth.routes";
import v1rootRouter from "./v1route";
import { errorMiddleware } from "./middleware/error";
import fileUpload from "express-fileupload";
import { seedCategories } from "./modules/category/seedcategory";
import { agenda } from "./modules/scheduler/agenda.scheduler";
import { seedGroups } from "./modules/group/seedGroups";

import cron from "node-cron";
import { MessageScheduler } from "./modules/message/message.scheduler";
import { MessageService } from "./modules/message/message.service";

const app = express();

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
// app.use(morgan("test"));

app.use(
  cors({
    origin: "*", // allow all origins

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],

    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(helmet());

// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//     // limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit if needed
//   })
// );

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  console.log("Request received at root endpoint");

  res.status(200).json({
    status: "success",
    message: "Server is healthy",
  });
});

app.post("/api/send-whatsapp", async (req: Request, res: Response) => {
  try {
    // const { to, message } = req.body;

    let to = "+2348012345678";
    let message =
      "Welcome to church guys! 🙏 Service starts at 9 AM this Sunday.";
    if (!to || !message) {
      return res.status(400).json({
        error: "Missing required fields: to, message",
      });
    }

    return res.json({
      data: "this is me",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// app.post("/api/v1/birthday/trigger-now", async (req, res) => {
//   await triggerBirthdayMessagesNow();
//   res.json({ message: "Birthday job triggered" });
// });
app.use("/api/v1", v1rootRouter);

app.use("/api/v1/auth", authRoutes);

app.use(notFound);
app.use(errorMiddleware);

// cron.schedule("*/30 * * * * *", () => {
//   console.log("Runs every 30 seconds");
// });

// cron.schedule("*/10 * * * * *", async (ctx) => {
// cron.schedule("0 8 * * *", async (ctx) => {
// cron.schedule("30 15 * * *", async (ctx) => {

cron.schedule("10 8 * * *", async (ctx) => {
  console.log(`Triggered At: ${ctx.triggeredAt.toISOString()}`);
  console.log(`Scheduled For: ${ctx.dateLocalIso}`);
  console.log(`Task Status: ${ctx.task.getStatus()}`);
  await MessageScheduler.birthdayjob();
});
// cron.schedule("*/10 * * * * *", async (ctx) => {
//   // cron.schedule("10 8 * * *", async (ctx) => {
//   console.log(`Triggered At: ${ctx.triggeredAt.toISOString()}`);
//   console.log(`Scheduled For: ${ctx.dateLocalIso}`);
//   console.log(`Task Status: ${ctx.task.getStatus()}`);
//   await MessageService.sendScheduledMessages();
// });
const startServer = async () => {
  try {
    await connectDB();
    await agenda.start();
    // await scheduleBirthdayMessages();
    // seedCategories();
    // seedGroups();

    app.listen(env.PORT, () =>
      logger.info(`Server is listening on PORT:${env.PORT}`)
    );
  } catch (error) {
    console.log("Error starting the server:", error);

    logger.error(error);
  }
};

startServer();
