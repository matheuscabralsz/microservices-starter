# Phase 2: Kafka Logger Integration - Detailed Implementation Plan

**Phase**: 2 of 5
**Goal**: Integrate Kafka-based logging into todo-nodejs-service
**Duration**: 3-4 hours
**Prerequisites**: Phase 1 completed (Kafka, Elasticsearch, Kibana running)

---

## Overview

This phase adds centralized logging capabilities to the `todo-nodejs-service` by:
1. Installing and configuring KafkaJS library
2. Creating a reusable Kafka logger utility
3. Implementing request/response logging middleware
4. Adding error logging
5. Publishing all logs to the Kafka `logs` topic

**What We'll Build**:
- Kafka producer singleton for publishing logs
- Universal log message schema (TypeScript interfaces)
- Fastify middleware to capture HTTP requests/responses
- Error handling with log publishing
- Business event logging capability

**End Result**: Every API request, error, and business event in the todo service will be automatically logged to Kafka.

---

## Prerequisites Check

Before starting, verify:
- [ ] Phase 1 is complete (Kafka is running)
- [ ] Kafka topic `logs` exists or auto-create is enabled
- [ ] Todo service is set up: `apps/services/todo-nodejs-service/`
- [ ] Todo service runs successfully: `nx serve todo-nodejs-service`
- [ ] Node.js 18+ installed
- [ ] You can connect to Kafka: `telnet localhost 9092`

---

## Step-by-Step Implementation

### Step 1: Install Dependencies

**Duration**: 5 minutes

**Navigate to Service Directory**:
```bash
cd /home/mack/my_workspace/microservices-starter/apps/services/todo-nodejs-service
```

**Install KafkaJS**:
```bash
npm install kafkajs@^2.2.4
```

**Install Type Definitions**:
```bash
npm install --save-dev @types/node
```

**Verify Installation**:
```bash
# Check package.json
cat package.json | grep kafkajs

# Should show: "kafkajs": "^2.2.4"
```

**Why KafkaJS?**
- Official Kafka client for Node.js
- Native TypeScript support
- Excellent documentation
- Active maintenance
- Production-ready

---

### Step 2: Create Log Types/Interfaces

**Duration**: 10 minutes

**File**: `src/types/log.types.ts`

**Create Types Directory** (if not exists):
```bash
mkdir -p src/types
```

**Implementation**:
```typescript
/**
 * Universal log message schema for centralized logging
 * All services must use this schema when publishing to Kafka
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type LogType = 'api' | 'error' | 'business' | 'security' | 'performance' | 'debug';

export type Environment = 'development' | 'staging' | 'production';

/**
 * Core log message structure
 */
export interface LogMessage {
  // Core fields (required)
  timestamp: string;          // ISO 8601 format
  level: LogLevel;
  service: string;            // Service name (e.g., 'todo-nodejs-service')
  logType: LogType;
  message: string;            // Human-readable log message

  // Optional metadata (varies by log type)
  metadata?: LogMetadata;

  // Environment info
  environment?: Environment;
  hostname?: string;
  version?: string;           // Service version
}

/**
 * Flexible metadata that varies by log type
 */
export interface LogMetadata {
  // API Request logs
  requestId?: string;
  method?: string;            // GET, POST, PUT, DELETE, PATCH
  path?: string;              // /api/v1/todos
  statusCode?: number;        // 200, 404, 500, etc.
  responseTime?: number;      // Milliseconds
  userAgent?: string;
  ip?: string;
  query?: Record<string, any>;
  body?: Record<string, any>; // Be careful with sensitive data

  // Error logs
  errorType?: string;         // TypeError, ValidationError, etc.
  errorStack?: string;        // Stack trace
  errorCode?: string;         // Custom error code

  // Business event logs
  userId?: string;
  transactionId?: string;
  action?: string;            // 'todo.created', 'todo.deleted'
  entity?: string;            // 'todo', 'user'
  entityId?: string;
  amount?: number;

  // Security logs
  authMethod?: string;
  permissions?: string[];
  accessDenied?: boolean;

  // Performance logs
  cpuUsage?: number;
  memoryUsage?: number;
  dbQueryTime?: number;

  // Additional context (flexible)
  [key: string]: any;
}

/**
 * API Request log (specific type)
 */
export interface ApiLogMessage extends LogMessage {
  logType: 'api';
  metadata: {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    ip?: string;
    userAgent?: string;
  };
}

/**
 * Error log (specific type)
 */
export interface ErrorLogMessage extends LogMessage {
  logType: 'error';
  level: 'error' | 'fatal';
  metadata: {
    errorType: string;
    errorStack?: string;
    errorCode?: string;
    requestId?: string;
  };
}

/**
 * Business event log (specific type)
 */
export interface BusinessLogMessage extends LogMessage {
  logType: 'business';
  metadata: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    transactionId?: string;
  };
}
```

**Why This Structure?**
- **Flexible**: `metadata` can contain any fields depending on log type
- **Type-safe**: TypeScript ensures correct structure
- **Extensible**: Easy to add new log types
- **Standardized**: Same schema across all services
- **Language-agnostic**: JSON structure works with any language

---

### Step 3: Create Kafka Configuration

**Duration**: 10 minutes

**File**: `src/config/kafka.config.ts`

**Create Config Directory** (if not exists):
```bash
mkdir -p src/config
```

**Implementation**:
```typescript
import { Kafka, Producer, logLevel } from 'kafkajs';

/**
 * Kafka configuration for logging
 */
export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  topic: string;
  enabled: boolean;
}

/**
 * Get Kafka configuration from environment variables
 */
export function getKafkaConfig(): KafkaConfig {
  return {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'todo-nodejs-service',
    topic: process.env.KAFKA_LOG_TOPIC || 'logs',
    enabled: process.env.KAFKA_LOGGING_ENABLED !== 'false', // Enabled by default
  };
}

/**
 * Kafka client singleton
 */
let kafkaClient: Kafka | null = null;
let kafkaProducer: Producer | null = null;

/**
 * Initialize Kafka client
 */
export function createKafkaClient(): Kafka {
  if (kafkaClient) {
    return kafkaClient;
  }

  const config = getKafkaConfig();

  kafkaClient = new Kafka({
    clientId: config.clientId,
    brokers: config.brokers,
    logLevel: logLevel.ERROR, // Only log Kafka errors, not debug info
    retry: {
      initialRetryTime: 100,
      retries: 5,
    },
    connectionTimeout: 3000,
    requestTimeout: 25000,
  });

  return kafkaClient;
}

/**
 * Get or create Kafka producer (singleton)
 */
export async function getKafkaProducer(): Promise<Producer> {
  if (kafkaProducer) {
    return kafkaProducer;
  }

  const kafka = createKafkaClient();
  kafkaProducer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
  });

  await kafkaProducer.connect();
  console.log('[Kafka] Producer connected successfully');

  return kafkaProducer;
}

/**
 * Gracefully disconnect Kafka producer
 */
export async function disconnectKafkaProducer(): Promise<void> {
  if (kafkaProducer) {
    await kafkaProducer.disconnect();
    kafkaProducer = null;
    console.log('[Kafka] Producer disconnected');
  }
}
```

**Environment Variables** (add to `.env`):
```env
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=todo-nodejs-service
KAFKA_LOG_TOPIC=logs
KAFKA_LOGGING_ENABLED=true
```

**Configuration Breakdown**:
- **Singleton pattern**: Only one producer instance across the application
- **Connection reuse**: Kafka connections are expensive, reuse them
- **Error handling**: Retry configuration for transient failures
- **Graceful shutdown**: Clean disconnect on app shutdown
- **Feature flag**: Can disable Kafka logging via environment variable

---

### Step 4: Create Kafka Logger Utility

**Duration**: 15 minutes

**File**: `src/utils/kafka-logger.ts`

**Create Utils Directory** (if not exists):
```bash
mkdir -p src/utils
```

**Implementation**:
```typescript
import { getKafkaProducer, getKafkaConfig } from '../config/kafka.config';
import {
  LogMessage,
  LogLevel,
  LogType,
  LogMetadata,
  ApiLogMessage,
  ErrorLogMessage,
  BusinessLogMessage,
} from '../types/log.types';
import os from 'os';

/**
 * KafkaLogger - Publishes structured logs to Kafka
 */
export class KafkaLogger {
  private serviceName: string;
  private environment: string;
  private version: string;

  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'todo-nodejs-service';
    this.environment = process.env.NODE_ENV || 'development';
    this.version = process.env.SERVICE_VERSION || '1.0.0';
  }

  /**
   * Publish log message to Kafka
   */
  private async publish(logMessage: LogMessage): Promise<void> {
    const config = getKafkaConfig();

    // Check if Kafka logging is enabled
    if (!config.enabled) {
      console.log('[Kafka] Logging disabled, skipping:', logMessage.message);
      return;
    }

    try {
      const producer = await getKafkaProducer();

      await producer.send({
        topic: config.topic,
        messages: [
          {
            key: this.serviceName, // Partition by service name
            value: JSON.stringify(logMessage),
            timestamp: Date.now().toString(),
          },
        ],
      });

      // Optional: log to console in development
      if (this.environment === 'development') {
        console.log(`[Kafka] Published ${logMessage.logType} log:`, logMessage.message);
      }
    } catch (error) {
      // NEVER let logging errors crash the application
      console.error('[Kafka] Failed to publish log:', error);
    }
  }

  /**
   * Create base log message with common fields
   */
  private createBaseLog(
    level: LogLevel,
    logType: LogType,
    message: string,
    metadata?: LogMetadata
  ): LogMessage {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      logType,
      message,
      metadata,
      environment: this.environment as any,
      hostname: os.hostname(),
      version: this.version,
    };
  }

  /**
   * Log API request/response
   */
  async logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    metadata?: Partial<LogMetadata>
  ): Promise<void> {
    const log: ApiLogMessage = {
      ...this.createBaseLog(
        'info',
        'api',
        `${method} ${path} ${statusCode} - ${responseTime}ms`,
        {
          method,
          path,
          statusCode,
          responseTime,
          ...metadata,
        }
      ),
      logType: 'api',
      metadata: {
        requestId: metadata?.requestId || '',
        method,
        path,
        statusCode,
        responseTime,
        ip: metadata?.ip,
        userAgent: metadata?.userAgent,
      },
    };

    await this.publish(log);
  }

  /**
   * Log application error
   */
  async logError(
    error: Error,
    metadata?: Partial<LogMetadata>
  ): Promise<void> {
    const log: ErrorLogMessage = {
      ...this.createBaseLog(
        'error',
        'error',
        error.message,
        {
          errorType: error.name,
          errorStack: error.stack,
          ...metadata,
        }
      ),
      logType: 'error',
      level: 'error',
      metadata: {
        errorType: error.name,
        errorStack: error.stack,
        errorCode: metadata?.errorCode,
        requestId: metadata?.requestId,
      },
    };

    await this.publish(log);
  }

  /**
   * Log business event
   */
  async logBusinessEvent(
    action: string,
    entity: string,
    metadata?: Partial<LogMetadata>
  ): Promise<void> {
    const log: BusinessLogMessage = {
      ...this.createBaseLog(
        'info',
        'business',
        `${action} on ${entity}`,
        {
          action,
          entity,
          ...metadata,
        }
      ),
      logType: 'business',
      metadata: {
        action,
        entity,
        entityId: metadata?.entityId,
        userId: metadata?.userId,
        transactionId: metadata?.transactionId,
      },
    };

    await this.publish(log);
  }

  /**
   * Generic log method
   */
  async log(
    level: LogLevel,
    logType: LogType,
    message: string,
    metadata?: LogMetadata
  ): Promise<void> {
    const log = this.createBaseLog(level, logType, message, metadata);
    await this.publish(log);
  }

  /**
   * Debug log
   */
  async debug(message: string, metadata?: LogMetadata): Promise<void> {
    await this.log('debug', 'debug', message, metadata);
  }

  /**
   * Info log
   */
  async info(message: string, metadata?: LogMetadata): Promise<void> {
    await this.log('info', 'debug', message, metadata);
  }

  /**
   * Warning log
   */
  async warn(message: string, metadata?: LogMetadata): Promise<void> {
    await this.log('warn', 'debug', message, metadata);
  }
}

// Export singleton instance
export const kafkaLogger = new KafkaLogger();
```

**Usage Examples**:
```typescript
// API request log
await kafkaLogger.logApiRequest('GET', '/api/v1/todos', 200, 45, {
  requestId: 'req-123',
  ip: '192.168.1.1',
});

// Error log
try {
  // some code
} catch (error) {
  await kafkaLogger.logError(error as Error, { requestId: 'req-123' });
}

// Business event log
await kafkaLogger.logBusinessEvent('todo.created', 'todo', {
  userId: 'user-123',
  entityId: 'todo-456',
});
```

---

### Step 5: Create Logging Middleware

**Duration**: 20 minutes

**File**: `src/middlewares/logging.middleware.ts`

**Create Middlewares Directory** (if not exists):
```bash
mkdir -p src/middlewares
```

**Implementation**:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { kafkaLogger } from '../utils/kafka-logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fastify plugin for request/response logging
 */
export async function loggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Generate unique request ID
  const requestId = uuidv4();

  // Attach request ID to request object for use in other handlers
  (request as any).requestId = requestId;

  // Start timer
  const startTime = Date.now();

  // Hook into response to log after request completes
  reply.addHook('onSend', async (request, reply, payload) => {
    const responseTime = Date.now() - startTime;
    const statusCode = reply.statusCode;
    const method = request.method;
    const path = request.url;

    // Extract client info
    const ip = request.ip || request.headers['x-forwarded-for'] as string || 'unknown';
    const userAgent = request.headers['user-agent'] || 'unknown';

    // Log API request (fire-and-forget, don't await)
    kafkaLogger.logApiRequest(method, path, statusCode, responseTime, {
      requestId,
      ip,
      userAgent,
      query: request.query as any,
    }).catch(err => {
      // Silently fail - never let logging break the app
      console.error('[Logging Middleware] Failed to log request:', err);
    });

    return payload;
  });
}

/**
 * Helper function to get request ID from request
 */
export function getRequestId(request: FastifyRequest): string {
  return (request as any).requestId || 'unknown';
}
```

**Install UUID** (if not already installed):
```bash
npm install uuid
npm install --save-dev @types/uuid
```

**Why This Approach?**
- **Non-blocking**: Uses `onSend` hook, doesn't block response
- **Fire-and-forget**: Kafka publish doesn't slow down API response
- **Request correlation**: Generates unique ID for each request
- **Comprehensive**: Captures method, path, status, response time, IP, user agent
- **Error-safe**: Logging failures won't crash the application

---

### Step 6: Register Middleware in Fastify

**Duration**: 10 minutes

**File**: `src/main.ts` or `src/app.ts` (depending on your structure)

**Locate Bootstrap File**:
```bash
# Find main entry point
ls src/main.ts src/app.ts src/index.ts
```

**Add Middleware Registration**:
```typescript
import { FastifyInstance } from 'fastify';
import { loggingMiddleware } from './middlewares/logging.middleware';
import { getKafkaProducer, disconnectKafkaProducer } from './config/kafka.config';

// ... existing imports ...

async function bootstrap() {
  const app: FastifyInstance = Fastify({
    logger: true, // Keep Fastify's built-in logger for local dev
  });

  // Initialize Kafka producer on startup
  try {
    await getKafkaProducer();
    app.log.info('Kafka producer initialized');
  } catch (error) {
    app.log.error('Failed to initialize Kafka producer:', error);
    // Don't crash the app if Kafka is unavailable
  }

  // Register logging middleware globally
  app.addHook('preHandler', loggingMiddleware);

  // ... register routes ...

  // Graceful shutdown - disconnect Kafka on app shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);

      await disconnectKafkaProducer();
      await app.close();

      process.exit(0);
    });
  });

  // Start server
  await app.listen({
    port: parseInt(process.env.PORT || '3100'),
    host: '0.0.0.0',
  });

  app.log.info(`Server listening on port ${process.env.PORT || '3100'}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

**Key Points**:
- **Early initialization**: Connect to Kafka on app startup
- **Global middleware**: All routes automatically logged
- **Graceful shutdown**: Disconnect Kafka before app exits
- **Error tolerance**: App starts even if Kafka is unavailable

---

### Step 7: Add Error Logging

**Duration**: 15 minutes

**Create Error Handler Middleware**:

**File**: `src/middlewares/error-handler.middleware.ts`

```typescript
import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { kafkaLogger } from '../utils/kafka-logger';
import { getRequestId } from './logging.middleware';

/**
 * Global error handler - logs all errors to Kafka
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const requestId = getRequestId(request);

  // Log error to Kafka (fire-and-forget)
  kafkaLogger.logError(error, {
    requestId,
    method: request.method,
    path: request.url,
    errorCode: error.code,
  }).catch(err => {
    console.error('[Error Handler] Failed to log error:', err);
  });

  // Send error response to client
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal Server Error' : error.message;

  reply.status(statusCode).send({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message,
      requestId, // Include request ID for troubleshooting
    },
  });
}
```

**Register Error Handler**:

Add to `src/main.ts`:
```typescript
import { errorHandler } from './middlewares/error-handler.middleware';

// ... inside bootstrap() ...

// Register global error handler
app.setErrorHandler(errorHandler);
```

**Why This Approach?**
- **Centralized**: All errors logged in one place
- **Request correlation**: Links errors to specific requests via requestId
- **Client-friendly**: Returns clean error response to client
- **Async logging**: Doesn't block error response

---

### Step 8: Add Business Event Logging (Optional)

**Duration**: 10 minutes

**Example**: Log business events in your route handlers

**File**: `src/routes/todos.routes.ts` (example)

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { kafkaLogger } from '../utils/kafka-logger';
import { getRequestId } from '../middlewares/logging.middleware';

// Create Todo Handler
export async function createTodoHandler(
  request: FastifyRequest<{ Body: CreateTodoDto }>,
  reply: FastifyReply
) {
  const requestId = getRequestId(request);

  try {
    // Business logic
    const todo = await todoService.create(request.body);

    // Log business event (fire-and-forget)
    kafkaLogger.logBusinessEvent('todo.created', 'todo', {
      entityId: todo.id,
      userId: request.body.userId || 'anonymous',
      requestId,
      transactionId: todo.id,
    }).catch(err => {
      console.error('Failed to log business event:', err);
    });

    return reply.status(201).send({
      success: true,
      data: todo,
    });
  } catch (error) {
    throw error; // Let error handler middleware handle it
  }
}

// Delete Todo Handler
export async function deleteTodoHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const requestId = getRequestId(request);

  try {
    const { id } = request.params;
    await todoService.delete(id);

    // Log business event
    kafkaLogger.logBusinessEvent('todo.deleted', 'todo', {
      entityId: id,
      requestId,
    }).catch(err => {
      console.error('Failed to log business event:', err);
    });

    return reply.status(204).send();
  } catch (error) {
    throw error;
  }
}
```

**When to Log Business Events?**
- User actions: login, logout, signup
- Entity lifecycle: created, updated, deleted
- Important transactions: payment processed, order placed
- Security events: access denied, password changed

**When NOT to log?**
- Simple GET requests (already logged by middleware)
- Internal system operations
- High-frequency events (may overwhelm Kafka)

---

### Step 9: Update Environment Variables

**Duration**: 5 minutes

**File**: `.env` (create if not exists)

```env
# Service Configuration
NODE_ENV=development
PORT=3100
SERVICE_NAME=todo-nodejs-service
SERVICE_VERSION=1.0.0

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=todo-nodejs-service
KAFKA_LOG_TOPIC=logs
KAFKA_LOGGING_ENABLED=true

# Database (existing config)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todo_db
```

**File**: `.env.example` (for documentation)

```env
# Service Configuration
NODE_ENV=development
PORT=3100
SERVICE_NAME=todo-nodejs-service
SERVICE_VERSION=1.0.0

# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=<your-service-name>
KAFKA_LOG_TOPIC=logs
KAFKA_LOGGING_ENABLED=true

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

**Load Environment Variables**:

Ensure you're loading `.env` file. If using `dotenv`:

```typescript
// At the top of src/main.ts
import 'dotenv/config';
```

Or install if needed:
```bash
npm install dotenv
```

---

### Step 10: Test the Integration

**Duration**: 20 minutes

**Test 1: Start the Services**

```bash
# Terminal 1: Ensure Kafka is running
cd /home/mack/my_workspace/microservices-starter/tools/local-dev
docker-compose ps kafka

# Should show: Up (healthy)
```

```bash
# Terminal 2: Start todo service
cd /home/mack/my_workspace/microservices-starter
nx serve todo-nodejs-service

# Watch for: "Kafka producer connected successfully"
```

**Expected Output**:
```
[Kafka] Producer connected successfully
Server listening on port 3100
```

**Test 2: Make API Requests**

```bash
# Terminal 3: Send test requests

# GET request
curl http://localhost:3100/api/v1/todos

# POST request
curl -X POST http://localhost:3100/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Todo","description":"Test logging"}'

# GET single todo
curl http://localhost:3100/api/v1/todos/1

# Trigger error (invalid ID)
curl http://localhost:3100/api/v1/todos/invalid-id
```

**Test 3: Verify Logs in Kafka**

```bash
# Terminal 4: Consume logs from Kafka
cd /home/mack/my_workspace/microservices-starter/tools/local-dev

docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic logs \
  --from-beginning
```

**Expected Output** (sample):
```json
{
  "timestamp": "2025-11-16T10:30:00.000Z",
  "level": "info",
  "service": "todo-nodejs-service",
  "logType": "api",
  "message": "GET /api/v1/todos 200 - 45ms",
  "metadata": {
    "requestId": "abc-123",
    "method": "GET",
    "path": "/api/v1/todos",
    "statusCode": 200,
    "responseTime": 45,
    "ip": "::1",
    "userAgent": "curl/7.88.1"
  },
  "environment": "development",
  "hostname": "your-hostname",
  "version": "1.0.0"
}
```

Press `Ctrl+C` to stop consuming.

**Test 4: Verify Log Count**

```bash
# Count total messages in logs topic
docker-compose exec kafka kafka-run-class kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 \
  --topic logs

# Should show increasing offsets as you make requests
```

**Test 5: Test Error Logging**

Create an intentional error in your code or trigger a validation error:

```bash
# Trigger validation error (missing required field)
curl -X POST http://localhost:3100/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{}'
```

Check Kafka for error log with `logType: "error"`.

**Test 6: Test Business Event Logging**

If you implemented business event logging:

```bash
# Create a todo (should trigger business event)
curl -X POST http://localhost:3100/api/v1/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Business Event Test","description":"Testing business logging"}'
```

Check Kafka for log with `logType: "business"`.

---

## Verification Checklist

After completing all steps, verify:

- [ ] KafkaJS installed in package.json
- [ ] Log types defined in `src/types/log.types.ts`
- [ ] Kafka config created in `src/config/kafka.config.ts`
- [ ] KafkaLogger utility created in `src/utils/kafka-logger.ts`
- [ ] Logging middleware created and registered
- [ ] Error handler middleware created and registered
- [ ] Environment variables configured
- [ ] Todo service starts without errors
- [ ] Kafka producer connects on startup
- [ ] API requests generate logs in Kafka
- [ ] Logs contain all required fields (timestamp, service, logType, etc.)
- [ ] Error logs appear when errors occur
- [ ] Business event logs appear (if implemented)
- [ ] Application doesn't crash if Kafka is unavailable

---

## Common Issues and Troubleshooting

### Issue: "Kafka producer failed to connect"

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:9092
```

**Solutions**:
1. Verify Kafka is running: `docker-compose ps kafka`
2. Check Kafka broker address in `.env`: `KAFKA_BROKERS=localhost:9092`
3. Test connection: `telnet localhost 9092`
4. Check Kafka logs: `docker-compose logs kafka`

### Issue: "Topic does not exist"

**Symptoms**:
```
KafkaJSProtocolError: Topic 'logs' does not exist
```

**Solutions**:
1. Check if auto-create is enabled in Kafka config
2. Manually create topic:
```bash
docker-compose exec kafka kafka-topics \
  --create \
  --topic logs \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1
```

### Issue: "Logs not appearing in Kafka"

**Debugging Steps**:
1. Check if Kafka logging is enabled: `KAFKA_LOGGING_ENABLED=true`
2. Check application logs for Kafka errors
3. Verify producer is connected: Look for "Producer connected" message
4. Test with Kafka CLI:
```bash
echo "test" | docker-compose exec -T kafka kafka-console-producer \
  --broker-list localhost:9092 \
  --topic logs
```
5. Consume to verify:
```bash
docker-compose exec kafka kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic logs \
  --from-beginning
```

### Issue: "Application slow or hanging"

**Possible Causes**:
- Synchronous logging (blocking)
- Not using fire-and-forget pattern

**Solution**:
Ensure all `kafkaLogger` calls use `.catch()` and don't use `await` in hot paths:

```typescript
// CORRECT (fire-and-forget)
kafkaLogger.logApiRequest(...).catch(err => console.error(err));

// WRONG (blocks response)
await kafkaLogger.logApiRequest(...);
```

### Issue: "Too many messages, Kafka consumer lag"

**Symptoms**: Kafka consumer can't keep up with message production

**Solutions**:
1. Reduce log volume (sample logs, don't log every request)
2. Increase Kafka partitions
3. Add more consumer instances (Phase 3)
4. Batch log messages

---

## Performance Considerations

### Logging Overhead

**Impact on Request Latency**:
- Fire-and-forget: ~0-1ms (negligible)
- Awaited logging: ~5-50ms (significant)

**Best Practices**:
- ✅ Use fire-and-forget for API request logs
- ✅ Use async/non-blocking Kafka producer
- ✅ Set appropriate Kafka timeouts
- ❌ Never await log publishing in hot paths
- ❌ Don't log sensitive data (passwords, tokens)

### Log Volume Estimation

For 100 requests/minute:
- Log size: ~500 bytes/log
- Total: 50KB/minute = 3MB/hour = 72MB/day

For 10,000 requests/minute (high load):
- Total: 5MB/minute = 300MB/hour = 7.2GB/day

**Optimization**:
- Sample logs (log 10% of successful requests)
- Don't log static assets (CSS, JS, images)
- Use log levels (DEBUG in dev, INFO in prod)

---

## Next Steps

After Phase 2 is complete:

1. **Phase 3**: Build Java consumer service to process logs
2. Index logs in Elasticsearch based on log type
3. Set up retention policies
4. Create Kibana dashboards

**Preparation for Phase 3**:
- Install Java 17+ and Maven
- Familiarize with Spring Boot
- Review Elasticsearch concepts

---

## Success Criteria

Phase 2 is complete when:

- ✅ KafkaJS installed and configured
- ✅ Universal log schema defined (TypeScript interfaces)
- ✅ Kafka producer connects on app startup
- ✅ All API requests automatically logged to Kafka
- ✅ Errors automatically logged to Kafka
- ✅ Logs contain all required fields (timestamp, service, logType, metadata)
- ✅ Logs visible in Kafka topic via console consumer
- ✅ Application gracefully handles Kafka unavailability
- ✅ No performance degradation (fire-and-forget logging)
- ✅ Business event logging implemented (optional)
- ✅ Code is clean, typed, and well-documented

**Estimated Completion Time**: 3-4 hours

---

## Code Quality Checklist

Before moving to Phase 3:

- [ ] All TypeScript types defined (no `any` types)
- [ ] Error handling implemented (try-catch blocks)
- [ ] Environment variables documented in `.env.example`
- [ ] Code follows project conventions
- [ ] No sensitive data logged (PII, passwords, tokens)
- [ ] Kafka producer uses singleton pattern
- [ ] Graceful shutdown implemented
- [ ] README updated with Kafka logging info
- [ ] Unit tests written (optional but recommended)

---

## References

- [KafkaJS Documentation](https://kafka.js.org/docs/getting-started)
- [Fastify Lifecycle Hooks](https://www.fastify.io/docs/latest/Reference/Hooks/)
- [Fastify Error Handling](https://www.fastify.io/docs/latest/Reference/Errors/)
- [UUID Library](https://www.npmjs.com/package/uuid)
