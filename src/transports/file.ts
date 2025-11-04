import type { LogEntry, Transport } from "../types.ts";
import { formatJSONL } from "../formatters/jsonl.ts";
import { mkdirSync } from "fs";
import { dirname } from "path";

/**
 * File transport
 * Writes logs to a JSONL file using Bun's native file API
 */
export class FileTransport implements Transport {
  private writer: ReturnType<ReturnType<typeof Bun.file>["writer"]>;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private filePath: string) {
    // Create directory if it doesn't exist
    const dir = dirname(filePath);
    mkdirSync(dir, { recursive: true });

    // Create a writer for the file (append mode)
    const file = Bun.file(filePath);
    this.writer = file.writer();
  }

  /**
   * Log an entry to the file
   * Writes are queued to ensure order
   */
  async log(entry: LogEntry): Promise<void> {
    const formatted = formatJSONL(entry);

    // Queue the write to maintain order
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        await this.writer.write(formatted);
      } catch (error) {
        // Log to console if file write fails
        console.error("Failed to write to log file:", error);
      }
    });

    return this.writeQueue;
  }

  /**
   * Flush any pending writes and close the writer
   */
  async flush(): Promise<void> {
    await this.writeQueue;
    await this.writer.flush();
    await this.writer.end();
  }
}
