import type { LoggerConfig, LogLevel, LogEntry, Transport } from "./types.ts";
import { ConsoleTransport } from "./transports/console.ts";
import { FileTransport } from "./transports/file.ts";
import { LokiTransport } from "./transports/loki.ts";
import { getISOTimestamp } from "./utils/timestamp.ts";

/**
 * Core Logger class
 * Manages multiple transports and provides logging methods
 */
export class Logger {
  private transports: Transport[] = [];
  private readonly service: string;
  private readonly environment?: string;
  private readonly host?: string;

  constructor(config: LoggerConfig) {
    this.service = config.service;
    this.environment = config.environment;
    this.host = config.host;

    // Initialize console transport (enabled by default)
    if (config.enableConsole !== false) {
      this.transports.push(new ConsoleTransport());
    }

    // Initialize file transport
    if (config.file && config.enableFile !== false) {
      this.transports.push(new FileTransport(config.file));
    }

    // Initialize Loki transport
    if (config.lokiUrl && config.enableLoki !== false) {
      const lokiLabels = {
        ...(config.environment && { environment: config.environment }),
        ...(config.host && { host: config.host }),
      };

      this.transports.push(
        new LokiTransport(config.lokiUrl, {
          ...config.loki,
          labels: { ...lokiLabels, ...config.loki?.labels },
        }),
      );
    }
  }

  /**
   * Create a log entry
   */
  private createEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): LogEntry {
    return {
      timestamp: getISOTimestamp(),
      level,
      service: this.service,
      message,
      metadata,
    };
  }

  /**
   * Log an entry to all transports
   */
  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
  ): void {
    const entry = this.createEntry(level, message, metadata);

    for (const transport of this.transports) {
      try {
        const result = transport.log(entry);
        // Handle async transports
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`Transport error:`, error);
          });
        }
      } catch (error) {
        console.error(`Transport error:`, error);
      }
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: Record<string, unknown>): void {
    this.log("error", message, metadata);
  }

  /**
   * Flush all transports
   * Call this before application shutdown to ensure all logs are sent
   */
  async flush(): Promise<void> {
    const flushPromises = this.transports
      .filter((transport) => transport.flush)
      .map((transport) => transport.flush!());

    await Promise.all(flushPromises);
  }
}
