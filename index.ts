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

// Error logging with Error object
try {
  throw new Error("Connection timeout");
} catch (err) {
  // Pass Error as second parameter
  logger.error("Database connection failed", err as Error, {
    event: "database_error",
    retries: 3,
  });
}

// Or without the Error object (backward compatible)
logger.error("API request failed", {
  event: "api_error",
  endpoint: "/users",
});

// Flush logs before exit
await logger.flush();

console.log("Logs written! Check ./logs/app.jsonl");