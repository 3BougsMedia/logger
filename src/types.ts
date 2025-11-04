/**
 * Log levels supported by the logger
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * Core log entry structure
 */
export interface LogEntry {
  timestamp: string; // ISO 8601 format
  level: LogLevel;
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for the logger
 */
export interface LoggerConfig {
  /** Service name (required) - used as Loki label */
  service: string;

  /** Environment name (optional) - used as Loki label */
  environment?: string;

  /** Host name (optional) - used as Loki label */
  host?: string;

  /** Enable console output (default: true) */
  enableConsole?: boolean;

  /** Enable file output (default: true if file is provided) */
  enableFile?: boolean;

  /** Path to JSONL log file (optional) */
  file?: string;

  /** Enable Loki output (default: true if lokiUrl is provided) */
  enableLoki?: boolean;

  /** Loki push API URL (e.g., http://localhost:3100) */
  lokiUrl?: string;

  /** Loki configuration */
  loki?: LokiConfig;
}

/**
 * Configuration for Loki transport
 */
export interface LokiConfig {
  /** Batch interval in milliseconds (default: 5000) */
  batchInterval?: number;

  /** Maximum logs per batch (default: 100) */
  batchSize?: number;

  /** Number of retry attempts (default: 3) */
  retries?: number;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Enable gzip compression (default: true) */
  compress?: boolean;

  /** Basic auth credentials (optional) */
  basicAuth?: string;

  /** Additional static labels */
  labels?: Record<string, string>;
}

/**
 * Loki push API stream structure
 */
export interface LokiStream {
  stream: Record<string, string>; // Labels
  values: [string, string][]; // [timestamp_ns, log_line]
}

/**
 * Loki push API payload structure
 */
export interface LokiPushPayload {
  streams: LokiStream[];
}

/**
 * Transport interface for log outputs
 */
export interface Transport {
  log(entry: LogEntry): void | Promise<void>;
  flush?(): Promise<void>;
}
