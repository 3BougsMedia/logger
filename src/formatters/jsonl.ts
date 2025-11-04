import type { LogEntry } from "../types.ts";

/**
 * Format log entry as JSONL (JSON Lines)
 * Each log is a single JSON object on one line, terminated with \n
 *
 * @param entry - Log entry to format
 * @returns JSON string with newline
 */
export function formatJSONL(entry: LogEntry): string {
  const logObject = {
    timestamp: entry.timestamp,
    level: entry.level,
    service: entry.service,
    message: entry.message,
    ...(entry.metadata && { ...entry.metadata }),
  };

  return JSON.stringify(logObject) + "\n";
}
