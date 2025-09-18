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
const app = express();

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

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
    // limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit if needed
  })
);

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  console.log("Request received at root endpoint");

  res.status(200).json({
    status: "success",
    message: "Server is healthy",
  });
});
app.use("/api/v1", v1rootRouter);

// app.use("/api/v1/auth", authRoutes);

// app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
// app.use(cors());

app.use(notFound);
app.use(errorMiddleware);

const startServer = async () => {
  try {
    await connectDB();
    await agenda.start();
    // seedCategories();
    app.listen(env.PORT, () =>
      logger.info(`Server is listening on PORT:${env.PORT}`)
    );
  } catch (error) {
    console.log("Error starting the server:", error);

    logger.error(error);
  }
};

startServer();
