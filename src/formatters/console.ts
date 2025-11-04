import type { LogEntry } from "../types.ts";
import { LogLevel } from "../types.ts";
import { formatConsoleTimestamp } from "../utils/timestamp.ts";

/**
 * ANSI color codes for console output
 */
const Colors = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",

  // Foreground colors
  Red: "\x1b[31m",
  Green: "\x1b[32m",
  Yellow: "\x1b[33m",
  Blue: "\x1b[34m",
  Magenta: "\x1b[35m",
  Cyan: "\x1b[36m",
  White: "\x1b[37m",
  Gray: "\x1b[90m",
} as const;

/**
 * Get color for log level
 */
function getLevelColor(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG:
      return Colors.Gray;
    case LogLevel.INFO:
      return Colors.Cyan;
    case LogLevel.WARN:
      return Colors.Yellow;
    case LogLevel.ERROR:
      return Colors.Red;
  }
}

/**
 * Format log level with color and padding
 */
function formatLevel(level: LogLevel): string {
  const color = getLevelColor(level);
  const levelStr = level.toUpperCase().padEnd(5); // Pad to 5 chars for alignment
  return `${color}${levelStr}${Colors.Reset}`;
}

/**
 * Format metadata for console output
 */
function formatMetadata(metadata?: Record<string, unknown>): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return "";
  }

  try {
    // Pretty print metadata with dim color
    return ` ${Colors.Dim}${JSON.stringify(metadata)}${Colors.Reset}`;
  } catch {
    // If JSON serialization fails, return empty string
    return "";
  }
}

/**
 * Format log entry for human-readable console output
 * Format: [2025-11-04 10:00:00] INFO: message { metadata }
 */
export function formatConsoleLog(entry: LogEntry): string {
  const timestamp = formatConsoleTimestamp(entry.timestamp);
  const level = formatLevel(entry.level);
  const metadata = formatMetadata(entry.metadata);

  return `${Colors.Gray}[${timestamp}]${Colors.Reset} ${level}: ${entry.message}${metadata}`;
}
