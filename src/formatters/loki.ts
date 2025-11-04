import type { LogEntry, LokiStream, LokiPushPayload } from "../types.ts";
import { toNanoseconds } from "../utils/timestamp.ts";

/**
 * Convert log entries to Loki push API format
 * Groups entries by their label set (service, level, event) into streams
 *
 * @param entries - Array of log entries to convert
 * @param staticLabels - Additional static labels to include
 * @returns Loki push payload
 */
export function formatLokiPayload(
  entries: LogEntry[],
  staticLabels: Record<string, string> = {},
): LokiPushPayload {
  // Group entries by their label set
  const streamMap = new Map<string, LogEntry[]>();

  for (const entry of entries) {
    // Extract event from metadata if present
    const event = entry.metadata?.event as string | undefined;

    // Build labels (low cardinality only)
    const labels = {
      service: entry.service,
      level: entry.level,
      ...(event && { event }),
      ...staticLabels,
    };

    // Create a unique key for this label set
    const labelKey = JSON.stringify(labels);

    // Group entries with the same labels
    const group = streamMap.get(labelKey) || [];
    group.push(entry);
    streamMap.set(labelKey, group);
  }

  // Convert groups to Loki streams
  const streams: LokiStream[] = [];

  for (const [labelKey, groupEntries] of streamMap) {
    const labels = JSON.parse(labelKey);

    // Build log line with message and metadata
    const values: [string, string][] = groupEntries.map((entry) => {
      // Create log line with message and metadata
      const logLine = {
        message: entry.message,
        ...(entry.metadata && { ...entry.metadata }),
      };

      return [
        toNanoseconds(entry.timestamp),
        JSON.stringify(logLine),
      ];
    });

    streams.push({ stream: labels, values });
  }

  return { streams };
}
