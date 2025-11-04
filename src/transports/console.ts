import type { LogEntry, Transport } from "../types.ts";
import { formatConsoleLog } from "../formatters/console.ts";

/**
 * Console transport
 * Writes formatted logs to stdout with colors
 */
export class ConsoleTransport implements Transport {
  log(entry: LogEntry): void {
    const formatted = formatConsoleLog(entry);
    console.log(formatted);
  }
}
