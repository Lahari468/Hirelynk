import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { CONSTANTS } from "./config/constants.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { sendError } from "./utils/response.js";
import routes from "./routes/index.js";

export const createApp = (): express.Application => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());

  const corsOptions = {
    origin: env.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };

  app.use(cors(corsOptions));

  const limiter = rateLimit({
    windowMs: CONSTANTS.RATE_LIMIT_WINDOW_MS,
    max: CONSTANTS.RATE_LIMIT_MAX_REQUESTS,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: false,
    skip: (req: Request) => {
      return req.path === "/api/health";
    },
  });

  app.use("/api/", limiter);

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  app.use(requestLogger);

  app.use("/api", routes);

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.use((_req: Request, res: Response) => {
    sendError(res, 404, "NOT_FOUND", "Endpoint not found");
  });

  app.use(errorHandler);

  return app;
};