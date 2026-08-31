import { createApp } from "./app.js";
import { env, isDevelopment } from "./config/env.js";

const startServer = async (): Promise<void> => {
  try {
    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`
        🚀 HireLynk API Server Started
        Server: http://localhost:${env.PORT}
        Environment: ${isDevelopment ? "development" : "production"}
        CORS Origin: ${env.FRONTEND_URL}
      `);

      if (isDevelopment) {
        console.log("📝 API Endpoints:");
        console.log(`   GET http://localhost:${env.PORT}/api/health`);
        console.log(`   GET http://localhost:${env.PORT}/api`);
      }
    });

    const shutdown = (): void => {
      console.log("\n📛 Shutting down gracefully...");

      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });

      setTimeout(() => {
        console.error("❌ Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    process.on("uncaughtException", (err: Error) => {
      console.error("❌ Uncaught Exception:", err);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason: unknown) => {
      console.error("❌ Unhandled Rejection:", reason);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();