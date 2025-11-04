import type { LogEntry, Transport, LokiConfig } from "../types.ts";
import { formatLokiPayload } from "../formatters/loki.ts";
import { retryWithBackoff } from "../utils/retry.ts";

/**
 * Loki transport
 * Batches logs and sends them to Loki push API
 */
export class LokiTransport implements Transport {
  private batch: LogEntry[] = [];
  private batchTimer?: Timer;
  private isFlushing = false;

  private readonly lokiUrl: string;
  private readonly batchInterval: number;
  private readonly batchSize: number;
  private readonly retries: number;
  private readonly timeout: number;
  private readonly compress: boolean;
  private readonly basicAuth?: string;
  private readonly staticLabels: Record<string, string>;

  constructor(lokiUrl: string, config: LokiConfig = {}) {
    this.lokiUrl = lokiUrl.replace(/\/$/, ""); // Remove trailing slash
    this.batchInterval = config.batchInterval ?? 5000;
    this.batchSize = config.batchSize ?? 100;
    this.retries = config.retries ?? 3;
    this.timeout = config.timeout ?? 30000;
    this.compress = config.compress ?? true;
    this.basicAuth = config.basicAuth;
    this.staticLabels = config.labels ?? {};

    // Start the batch timer
    this.startBatchTimer();
  }

  /**
   * Add log entry to batch
   */
  log(entry: LogEntry): void {
    this.batch.push(entry);

    // If batch is full, send immediately
    if (this.batch.length >= this.batchSize) {
      this.sendBatch().catch((error) => {
        console.error("Failed to send Loki batch:", error);
      });
    }
  }

  /**
   * Start the batch timer
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.batch.length > 0) {
        this.sendBatch().catch((error) => {
          console.error("Failed to send Loki batch:", error);
        });
      }
    }, this.batchInterval);
  }

  /**
   * Send current batch to Loki
   */
  private async sendBatch(): Promise<void> {
    if (this.batch.length === 0 || this.isFlushing) {
      return;
    }

    // Take current batch and reset
    const entries = [...this.batch];
    this.batch = [];

    // Sort entries by timestamp to ensure chronological order
    entries.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Convert to Loki format
    const payload = formatLokiPayload(entries, this.staticLabels);

    // Send with retry logic
    try {
      await retryWithBackoff(
        () => this.sendToLoki(payload),
        this.retries,
        1000,
      );
    } catch (error) {
      // After all retries failed, log error and drop the batch
      console.error(
        `Failed to send ${entries.length} logs to Loki after ${this.retries} retries:`,
        error,
      );
    }
  }

  /**
   * Send payload to Loki push API
   */
  private async sendToLoki(payload: unknown): Promise<void> {
    const url = `${this.lokiUrl}/loki/api/v1/push`;

    // Prepare body
    let body: string | Uint8Array = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Compress if enabled
    if (this.compress) {
      body = Bun.gzipSync(new TextEncoder().encode(body));
      headers["Content-Encoding"] = "gzip";
    }

    // Add basic auth if provided
    if (this.basicAuth) {
      const encoded = btoa(this.basicAuth);
      headers["Authorization"] = `Basic ${encoded}`;
    }

    // Send request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Loki responded with ${response.status}: ${text}`,
        );
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Flush remaining logs and stop the timer
   */
  async flush(): Promise<void> {
    // Stop the timer
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Mark as flushing
    this.isFlushing = true;

    // Send any remaining logs
    if (this.batch.length > 0) {
      await this.sendBatch();
    }

    this.isFlushing = false;
  }
}
