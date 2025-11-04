/**
 * Example usage of the logger library
 */
import { createLogger } from "./src/index.ts";

// Create a logger instance
const logger = createLogger({
  service: "example-app",
  environment: "development",
  file: "./logs/app.jsonl",
  // Uncomment to enable Loki
  // lokiUrl: "http://localhost:3100",
});

// Log some messages
logger.info("Application started", { port: 3000 });
logger.debug("Debug information", { userId: 123 });
logger.warn("High memory usage detected", { event: "high_memory", usage: "85%" });
logger.error("Database connection failed", {
  event: "database_error",
  error: "Connection timeout",
});

// Flush logs before exit
await logger.flush();

console.log("Logs written! Check ./logs/app.jsonl");