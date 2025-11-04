# @myorg/logger

A **Bun-native logging library** with multi-transport support for console, file (JSONL), and Grafana Loki.

## Features

- 🎨 **Colored Console Output**: Human-readable logs with ANSI colors
- 📝 **JSONL File Logging**: Structured logs in JSON Lines format
- 📊 **Loki Integration**: Batched push to Grafana Loki with proper labeling
- ⚡ **Zero Dependencies**: Pure Bun APIs for maximum performance
- 🔄 **Async File Writes**: Non-blocking file operations with queue management
- 🔁 **Retry Logic**: Exponential backoff for Loki failures
- 📦 **TypeScript**: Full type safety with strict mode

## Installation

```bash
bun add @myorg/logger
```

## Quick Start

```typescript
import { createLogger } from "@myorg/logger";

const logger = createLogger({
  service: "my-api",
  environment: "production",
  file: "./logs/app.jsonl",
});

logger.info("Server started", { port: 3000 });
logger.error("Database error", { error: err.message, event: "db_error" });
```

## Configuration

```typescript
interface LoggerConfig {
  // Required
  service: string;                    // Service name (Loki label)

  // Optional transports
  enableConsole?: boolean;            // Default: true
  enableFile?: boolean;               // Default: true if file is provided
  file?: string;                      // Path to JSONL log file

  // Loki integration
  enableLoki?: boolean;               // Default: true if lokiUrl is provided
  lokiUrl?: string;                   // Loki push API URL
  loki?: {
    batchInterval?: number;           // Default: 5000ms
    batchSize?: number;               // Default: 100 logs
    retries?: number;                 // Default: 3
    timeout?: number;                 // Default: 30000ms
    compress?: boolean;               // Default: true (gzip)
    basicAuth?: string;               // Format: "user:pass"
    labels?: Record<string, string>;  // Additional static labels
  };

  // Metadata
  environment?: string;               // Environment (Loki label)
  host?: string;                      // Host name (Loki label)
}
```

## Log Levels

```typescript
logger.debug("Debugging information", { trace: "xyz" });
logger.info("Normal operation", { user: "alice" });
logger.warn("Warning condition", { event: "high_memory" });

// Error logging with metadata only
logger.error("Error occurred", { event: "api_timeout", endpoint: "/users" });

// Error logging with Error object (automatically extracts message, name, and stack)
try {
  // Some operation that might fail
  await database.connect();
} catch (err) {
  // Pass Error as second parameter
  logger.error("Database connection failed", err as Error, {
    event: "db_error",
    retries: 3,
  });
}

// Error logging with just the Error object
logger.error("Operation failed", new Error("Something went wrong"));
```

The error logs will automatically include:
- `error`: Error message
- `errorName`: Error type (Error, TypeError, etc.)
- `errorStack`: Full stack trace
- Plus any additional metadata you provide

## Loki Integration

### Basic Setup

```typescript
const logger = createLogger({
  service: "my-api",
  lokiUrl: "http://localhost:3100",
  loki: {
    batchInterval: 5000,  // Send every 5 seconds
    batchSize: 100,       // Max 100 logs per batch
    retries: 3,           // Retry failed requests
  },
});
```

### Label Best Practices

**Use as labels** (low cardinality, <100 unique values):
- `service`: Service name
- `level`: Log level (debug, info, warn, error)
- `event`: Event type (e.g., "db_error", "api_call", "user_login")
- `environment`: Environment (prod, staging, dev)

**Use in metadata** (high cardinality):
- User IDs
- Request IDs
- Trace IDs
- Session tokens
- IP addresses

```typescript
// ✅ Good: event is a bounded category
logger.error("Payment failed", {
  event: "payment_error",  // Used as Loki label
  userId: "12345",         // In metadata, not a label
  orderId: "ord_789",      // In metadata, not a label
});

// ❌ Bad: userId creates too many streams
logger.error("Payment failed", {
  event: `payment_error_${userId}`,  // Don't do this!
});
```

## Graceful Shutdown

Always flush logs before application exit to ensure all batched logs are sent:

```typescript
process.on("SIGTERM", async () => {
  await logger.flush();
  process.exit(0);
});
```

## Development

```bash
# Install dependencies
bun install

# Run example
bun index.ts

# Run tests
bun test
```

## File Output Format

Logs are written in JSONL (JSON Lines) format, one JSON object per line:

```jsonl
{"timestamp":"2025-11-04T10:00:00.123Z","level":"info","service":"my-api","message":"Server started","port":3000}
{"timestamp":"2025-11-04T10:00:01.456Z","level":"error","service":"my-api","message":"Database error","event":"db_error","error":"Connection timeout"}
```

## Console Output Format

Colored, human-readable output:

```
[2025-11-04 10:00:00] INFO : Server started {"port":3000}
[2025-11-04 10:00:01] ERROR: Database error {"event":"db_error","error":"Connection timeout"}
```

## License

MIT

---

Built with [Bun](https://bun.com) 🥟
