import dotenv from "dotenv";

// Load environment variables BEFORE anything else
dotenv.config();

import app from "./src/app.js";    // Use a stable relative path

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

// Validate port
if (Number.isNaN(PORT)) {
  console.error("Invalid PORT value in environment variables");
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* ============================================================
   GLOBAL FAIL-SAFE ERROR HANDLING
============================================================ */

// Prevent Node from crashing on unhandled async errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection:", reason);
});

// Prevent crashes from synchronous app-level errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Graceful shutdown for PM2, Docker, Render, Railway, etc.
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  server.close(() => process.exit(0));
});
