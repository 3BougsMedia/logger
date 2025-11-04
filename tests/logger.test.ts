import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { createLogger, LogLevel } from "../src/index.ts";
import { rmSync, existsSync, readFileSync } from "fs";

describe("Logger", () => {
  const testLogFile = "./tests/test.jsonl";

  // Clean up before each test
  beforeEach(() => {
    if (existsSync(testLogFile)) {
      rmSync(testLogFile);
    }
  });

  // Clean up after each test
  afterEach(() => {
    if (existsSync(testLogFile)) {
      rmSync(testLogFile);
    }
  });

  test("should create logger with factory function", () => {
    const logger = createLogger({
      service: "test-service",
      enableConsole: false,
    });

    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  test("should write logs to file in JSONL format", async () => {
    const logger = createLogger({
      service: "test-service",
      file: testLogFile,
      enableConsole: false,
    });

    logger.info("Test message", { userId: 123 });
    logger.error("Error message", { event: "test_error" });

    // Flush to ensure writes complete
    await logger.flush();

    // Read and parse the file
    const content = readFileSync(testLogFile, "utf-8");
    const lines = content.trim().split("\n");

    expect(lines.length).toBe(2);

    const log1 = JSON.parse(lines[0]);
    expect(log1.level).toBe("info");
    expect(log1.service).toBe("test-service");
    expect(log1.message).toBe("Test message");
    expect(log1.userId).toBe(123);

    const log2 = JSON.parse(lines[1]);
    expect(log2.level).toBe("error");
    expect(log2.message).toBe("Error message");
    expect(log2.event).toBe("test_error");
  });

  test("should include timestamp in logs", async () => {
    const logger = createLogger({
      service: "test-service",
      file: testLogFile,
      enableConsole: false,
    });

    logger.info("Test message");
    await logger.flush();

    const content = readFileSync(testLogFile, "utf-8");
    const log = JSON.parse(content.trim());

    expect(log.timestamp).toBeDefined();
    expect(new Date(log.timestamp).toString()).not.toBe("Invalid Date");
  });

  test("should support all log levels", async () => {
    const logger = createLogger({
      service: "test-service",
      file: testLogFile,
      enableConsole: false,
    });

    logger.debug("Debug message");
    logger.info("Info message");
    logger.warn("Warn message");
    logger.error("Error message");

    await logger.flush();

    const content = readFileSync(testLogFile, "utf-8");
    const lines = content.trim().split("\n");

    expect(lines.length).toBe(4);
    expect(JSON.parse(lines[0]).level).toBe(LogLevel.DEBUG);
    expect(JSON.parse(lines[1]).level).toBe(LogLevel.INFO);
    expect(JSON.parse(lines[2]).level).toBe(LogLevel.WARN);
    expect(JSON.parse(lines[3]).level).toBe(LogLevel.ERROR);
  });

  test("should include service name in logs", async () => {
    const logger = createLogger({
      service: "my-api-service",
      file: testLogFile,
      enableConsole: false,
    });

    logger.info("Test");
    await logger.flush();

    const content = readFileSync(testLogFile, "utf-8");
    const log = JSON.parse(content.trim());

    expect(log.service).toBe("my-api-service");
  });

  test("should merge metadata into log entry", async () => {
    const logger = createLogger({
      service: "test-service",
      file: testLogFile,
      enableConsole: false,
    });

    logger.info("User logged in", {
      userId: 456,
      email: "test@example.com",
      event: "user_login",
    });

    await logger.flush();

    const content = readFileSync(testLogFile, "utf-8");
    const log = JSON.parse(content.trim());

    expect(log.userId).toBe(456);
    expect(log.email).toBe("test@example.com");
    expect(log.event).toBe("user_login");
  });

  test("should handle logs without metadata", async () => {
    const logger = createLogger({
      service: "test-service",
      file: testLogFile,
      enableConsole: false,
    });

    logger.info("Simple message");
    await logger.flush();

    const content = readFileSync(testLogFile, "utf-8");
    const log = JSON.parse(content.trim());

    expect(log.message).toBe("Simple message");
    expect(log.level).toBe("info");
    expect(log.service).toBe("test-service");
  });

  test("should work with console disabled", async () => {
    const logger = createLogger({
      service: "test-service",
      enableConsole: false,
      file: testLogFile,
    });

    logger.info("Test");
    await logger.flush();

    const content = readFileSync(testLogFile, "utf-8");
    expect(content.trim().length).toBeGreaterThan(0);
  });

  test("should work with file disabled", () => {
    const logger = createLogger({
      service: "test-service",
      enableFile: false,
    });

    // Should not throw
    logger.info("Test");
    logger.error("Error");
  });

  test("should handle Error objects in error logs", async () => {
    const logger = createLogger({
      service: "test-service",
      file: testLogFile,
      enableConsole: false,
    });

    const error = new Error("Something went wrong");
    logger.error("Operation failed", error);

    await logger.flush();

    const content = readFileSync(testLogFile, "utf-8");
    const log = JSON.parse(content.trim());

    expect(log.message).toBe("Operation failed");
    expect(log.error).toBe("Something went wrong");
    expect(log.errorName).toBe("Error");
    expect(log.errorStack).toBeDefined();
    expect(log.errorStack).toContain("Something went wrong");
  });

  test("should handle Error objects with additional metadata", async () => {
    const logger = createLogger({
      service: "test-service",
      file: testLogFile,
      enableConsole: false,
    });

    const error = new Error("Database timeout");
    logger.error("DB operation failed", error, {
      event: "db_error",
      query: "SELECT * FROM users",
      retries: 3,
    });

    await logger.flush();

    const content = readFileSync(testLogFile, "utf-8");
    const log = JSON.parse(content.trim());

    expect(log.message).toBe("DB operation failed");
    expect(log.error).toBe("Database timeout");
    expect(log.errorName).toBe("Error");
    expect(log.errorStack).toBeDefined();
    expect(log.event).toBe("db_error");
    expect(log.query).toBe("SELECT * FROM users");
    expect(log.retries).toBe(3);
  });

  test("should maintain backward compatibility without Error object", async () => {
    const logger = createLogger({
      service: "test-service",
      file: testLogFile,
      enableConsole: false,
    });

    logger.error("Simple error", { event: "test_error", code: 500 });

    await logger.flush();

    const content = readFileSync(testLogFile, "utf-8");
    const log = JSON.parse(content.trim());

    expect(log.message).toBe("Simple error");
    expect(log.event).toBe("test_error");
    expect(log.code).toBe(500);
  });
});

describe("Timestamp utilities", () => {
  test("should generate ISO timestamps", async () => {
    const { getISOTimestamp } = await import("../src/utils/timestamp.ts");
    const timestamp = getISOTimestamp();

    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test("should convert to nanoseconds", async () => {
    const { toNanoseconds } = await import("../src/utils/timestamp.ts");
    const ns = toNanoseconds(new Date("2025-01-01T00:00:00.000Z"));

    expect(ns).toBe("1735689600000000000");
  });
});

describe("Formatters", () => {
  test("should format JSONL correctly", async () => {
    const { formatJSONL } = await import("../src/formatters/jsonl.ts");

    const entry = {
      timestamp: "2025-01-01T00:00:00.000Z",
      level: LogLevel.INFO,
      service: "test",
      message: "Test message",
      metadata: { userId: 123 },
    };

    const formatted = formatJSONL(entry);

    expect(formatted).toContain('"level":"info"');
    expect(formatted).toContain('"service":"test"');
    expect(formatted).toContain('"message":"Test message"');
    expect(formatted).toContain('"userId":123');
    expect(formatted).toEndWith("\n");
  });

  test("should format Loki payload correctly", async () => {
    const { formatLokiPayload } = await import("../src/formatters/loki.ts");

    const entries = [
      {
        timestamp: "2025-01-01T00:00:00.000Z",
        level: LogLevel.INFO,
        service: "test",
        message: "Test message",
        metadata: { event: "test_event" },
      },
    ];

    const payload = formatLokiPayload(entries);

    expect(payload.streams).toHaveLength(1);
    expect(payload.streams[0].stream.service).toBe("test");
    expect(payload.streams[0].stream.level).toBe("info");
    expect(payload.streams[0].stream.event).toBe("test_event");
    expect(payload.streams[0].values).toHaveLength(1);
  });
});
