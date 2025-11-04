/**
 * Main entry point for the logger library
 */

export { Logger } from "./logger.ts";
export { LogLevel } from "./types.ts";
export type { LoggerConfig, LogEntry, LokiConfig } from "./types.ts";

import { Logger } from "./logger.ts";
import type { LoggerConfig } from "./types.ts";

/**
 * Create a new logger instance
 *
 * @param config - Logger configuration
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * import { createLogger } from "@myorg/logger";
 *
 * const logger = createLogger({
 *   service: "my-service",
 *   environment: "production",
 *   file: "./logs/app.jsonl",
 *   lokiUrl: "http://localhost:3100",
 * });
 *
 * logger.info("Server started", { port: 3000 });
 * logger.error("Database error", { error: err.message, event: "db_error" });
 *
 * // Before shutdown
 * await logger.flush();
 * ```
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}
