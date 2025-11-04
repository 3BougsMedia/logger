/**
 * Get current timestamp in ISO 8601 format
 * @returns ISO 8601 timestamp string (e.g., "2025-11-04T10:00:00.123Z")
 */
export function getISOTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Convert Date or timestamp to Unix nanoseconds as string (for Loki)
 * Loki requires timestamp as string in nanoseconds format
 * @param date - Date object or ISO string (defaults to now)
 * @returns Unix timestamp in nanoseconds as string
 */
export function toNanoseconds(date?: Date | string): string {
  const timestamp = date
    ? typeof date === "string"
      ? new Date(date)
      : date
    : new Date();

  // Get milliseconds since epoch and convert to nanoseconds
  const ms = timestamp.getTime();
  const ns = ms * 1_000_000;

  return ns.toString();
}

/**
 * Format timestamp for human-readable console output
 * @param isoString - ISO 8601 timestamp
 * @returns Formatted timestamp (e.g., "2025-11-04 10:00:00")
 */
export function formatConsoleTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
