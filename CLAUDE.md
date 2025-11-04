# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Bun-native logging library** (`@myorg/logger`) that provides multi-transport logging with:
- **Console output**: Colored, human-readable logs
- **File output**: JSONL (JSON Lines) format for structured logging
- **Loki integration**: Batched push to Grafana Loki with proper labeling

**Important**: Always use Bun commands, not Node.js/npm equivalents. Bun is an all-in-one JavaScript runtime with native TypeScript support, built-in bundler, and significantly faster performance than Node.js.

## Common Commands

### Development
```bash
# Run the application
bun run index.ts
bun index.ts              # shorter version

# Run with hot reload (auto-restart on file changes)
bun --hot index.ts
```

### Dependencies
```bash
# Install dependencies
bun install

# Add a new dependency
bun add <package>

# Add a dev dependency
bun add -d <package>
```

### Testing
```bash
# Run tests (when test files are added)
bun test

# Run specific test file
bun test <file>
```

### Build
```bash
# Bundle the application
bun build index.ts --outdir ./dist --target bun
```

## Code Architecture

### Project Structure
```
src/
├── types.ts              # Core interfaces and types
├── formatters/
│   ├── console.ts        # ANSI colored console formatter
│   ├── jsonl.ts          # JSONL file formatter
│   └── loki.ts           # Loki push API formatter
├── transports/
│   ├── console.ts        # Console transport
│   ├── file.ts           # Async file writer (JSONL)
│   └── loki.ts           # Loki HTTP transport with batching
├── utils/
│   ├── timestamp.ts      # ISO 8601 and Unix nanoseconds
│   └── retry.ts          # Exponential backoff retry logic
├── logger.ts             # Core Logger class
└── index.ts              # Public API exports
tests/
└── logger.test.ts        # Comprehensive test suite
```

### Architecture Overview

**Logger Class** (`src/logger.ts`):
- Manages multiple transports (console, file, Loki)
- Provides logging methods: `.debug()`, `.info()`, `.warn()`, `.error()`
- Factory pattern: `createLogger(config)` creates new instances

**Transports**:
- **Console**: Immediate colored output to stdout
- **File**: Async JSONL writer using `Bun.file().writer()`
- **Loki**: Batches logs every 5 seconds, sends via HTTP POST with retry logic

**Key Design Decisions**:
- No external dependencies (pure Bun APIs)
- Async file writes with queue to maintain order
- Loki batching reduces API calls and network overhead
- Labels (service, level, event) must be low-cardinality (<100 unique values)
- High-cardinality data (user IDs, trace IDs) goes in metadata, not labels

### TypeScript Configuration
- **Target**: ESNext with module preservation
- **Strict Mode**: Enabled with all strict checks
- **No Emit**: Bun handles transpilation directly, no JS output files
- **Bundler Mode**: Allows importing `.ts` files directly
- **Indexed Access**: Returns `T | undefined` for safety (`noUncheckedIndexedAccess: true`)

## Development Guidelines

### Use Bun APIs First
Prefer Bun's native APIs over Node.js equivalents when available:
- File I/O: Use `Bun.file()` instead of `fs`
- HTTP Server: Use `Bun.serve()` instead of `http`
- Environment: Use `Bun.env` instead of `process.env`
- Hashing: Use `Bun.hash()` for fast native hashing

### TypeScript Practices
- Strict typing is enforced - embrace it
- Use `type` keyword for type-only imports: `import type { Foo } from './types'`
- Array/object access returns potentially undefined - handle it appropriately
- Override keyword required when overriding methods

### Module Imports
- You can import `.ts` files directly without extensions: `import { foo } from './utils'`
- Or with extensions: `import { foo } from './utils.ts'`
- Both work due to bundler module resolution

## Usage Examples

### Basic Usage
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

### With Loki
```typescript
const logger = createLogger({
  service: "my-api",
  environment: "production",
  file: "./logs/app.jsonl",
  lokiUrl: "http://localhost:3100",
  loki: {
    batchInterval: 5000,  // Send every 5 seconds
    batchSize: 100,        // Max 100 logs per batch
    retries: 3,            // Retry failed requests 3 times
  },
});
```

### Log Levels
```typescript
logger.debug("Debugging information", { trace: "xyz" });
logger.info("Normal operation", { user: "alice" });
logger.warn("Warning condition", { event: "high_memory" });

// Error logging - supports Error objects as second parameter
logger.error("Database error", err, { event: "db_error", retries: 3 });
logger.error("API failed", { event: "api_timeout", endpoint: "/users" });
```

**Error Logging**: The `.error()` method has special handling for Error objects:
- `error(message, error)` - Extracts error message, name, and stack trace
- `error(message, error, metadata)` - Combines error info with additional metadata
- `error(message, metadata)` - Standard logging (backward compatible)

### Graceful Shutdown
```typescript
// Flush all pending logs before exit
await logger.flush();
```

### Loki Labels Best Practices
**Use as labels** (low cardinality):
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
// Good: event is a bounded category
logger.error("Payment failed", {
  event: "payment_error",  // Used as Loki label
  userId: "12345",         // In metadata, not a label
  orderId: "ord_789",      // In metadata, not a label
});
```
