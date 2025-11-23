# Phase 1: Detailed Implementation Steps (AI Guide)

## Meta Information
- **Purpose**: AI assistant implementation guide
- **Human-readable**: Not required
- **Focus**: Precise steps, code examples, commands
- **Status**: Ready for execution

---

## STEP 1: Docker Compose Kafka Infrastructure

### 1.1 Check Existing Docker Compose
```bash
cat tools/local-dev/docker-compose.yml
```

### 1.2 Add Kafka Services to Docker Compose

File: `tools/local-dev/docker-compose.yml`

Add these services (append or merge with existing):

```yaml
services:
  # ... existing services ...

  kafka:
    image: apache/kafka:3.8.1
    container_name: kafka-broker
    ports:
      - "9092:9092"
      - "9093:9093"
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      KAFKA_NUM_PARTITIONS: 3
      CLUSTER_ID: 'MkU3OEVBNTcwNTJENDM2Qk'
    volumes:
      - kafka-data:/var/lib/kafka/data
    healthcheck:
      test: ["CMD-SHELL", "kafka-broker-api-versions.sh --bootstrap-server localhost:9092 || exit 1"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - microservices-network

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
      DYNAMIC_CONFIG_ENABLED: 'true'
    depends_on:
      kafka:
        condition: service_healthy
    networks:
      - microservices-network

volumes:
  kafka-data:
    driver: local

networks:
  microservices-network:
    driver: bridge
```

### 1.3 Create Kafka Topic Initialization Script

File: `tools/local-dev/kafka/init-topics.sh`

```bash
#!/bin/bash
set -e

KAFKA_BROKER="kafka:9092"

echo "Waiting for Kafka to be ready..."
sleep 10

echo "Creating todo-events topic..."
kafka-topics.sh --create \
  --bootstrap-server $KAFKA_BROKER \
  --topic todo-events \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete \
  --if-not-exists

echo "Topic created successfully!"

kafka-topics.sh --describe \
  --bootstrap-server $KAFKA_BROKER \
  --topic todo-events
```

Make executable:
```bash
chmod +x tools/local-dev/kafka/init-topics.sh
```

### 1.4 Start Infrastructure

```bash
cd tools/local-dev
docker-compose up -d kafka kafka-ui
docker-compose ps
docker-compose logs -f kafka
```

### 1.5 Verify Kafka

```bash
# Check Kafka is running
docker-compose exec kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# List topics (should be empty initially)
docker-compose exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092

# Access Kafka UI
# Browser: http://localhost:8080
```

### 1.6 Create Topic Manually (if init script not working)

```bash
docker-compose exec kafka kafka-topics.sh --create \
  --bootstrap-server localhost:9092 \
  --topic todo-events \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000
```

---

## STEP 2: Database Schema Updates

### 2.1 Create Migration Files Directory

```bash
mkdir -p apps/services/todo-nodejs-service/migrations
```

### 2.2 Create Events Table Migration

File: `apps/services/todo-nodejs-service/migrations/001_create_events_table.sql`

```sql
-- Create events table for event sourcing
CREATE TABLE IF NOT EXISTS events (
    event_id UUID PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    aggregate_id UUID NOT NULL,
    user_id UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_events_aggregate_id ON events(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_aggregate_version ON events(aggregate_id, version);

-- Unique constraint to prevent duplicate events
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_event_id_unique ON events(event_id);

-- Comments
COMMENT ON TABLE events IS 'Event store for event sourcing pattern';
COMMENT ON COLUMN events.event_id IS 'Unique event identifier (UUID)';
COMMENT ON COLUMN events.aggregate_id IS 'Todo ID (aggregate root)';
COMMENT ON COLUMN events.version IS 'Event version for optimistic locking';
```

### 2.3 Update Todos Table Migration

File: `apps/services/todo-nodejs-service/migrations/002_update_todos_table.sql`

```sql
-- Add new columns to existing todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;

-- Add index for user_id
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);

-- Add index for due_date (for reminder queries in Phase 4)
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date) WHERE due_date IS NOT NULL;

-- Comments
COMMENT ON COLUMN todos.user_id IS 'User who owns this todo (mocked in Phase 1)';
COMMENT ON COLUMN todos.due_date IS 'Optional due date for todo item';
COMMENT ON COLUMN todos.version IS 'Version number for optimistic locking';
```

### 2.4 Run Migrations

Check PostgreSQL connection first:
```bash
# Get database credentials from .env
cat apps/services/todo-nodejs-service/.env | grep DB_

# Test connection
docker-compose exec postgres psql -U postgres -d todos -c "SELECT version();"
```

Run migrations:
```bash
cd apps/services/todo-nodejs-service

# Migration 1
docker-compose exec -T postgres psql -U postgres -d todos < migrations/001_create_events_table.sql

# Migration 2
docker-compose exec -T postgres psql -U postgres -d todos < migrations/002_update_todos_table.sql

# Verify tables
docker-compose exec postgres psql -U postgres -d todos -c "\dt"
docker-compose exec postgres psql -U postgres -d todos -c "\d events"
docker-compose exec postgres psql -U postgres -d todos -c "\d todos"
```

---

## STEP 3: Node.js Kafka Producer Integration

### 3.1 Install KafkaJS

```bash
cd apps/services/todo-nodejs-service
npm install kafkajs
npm install --save-dev @types/kafkajs
```

### 3.2 Create Event Types

File: `apps/services/todo-nodejs-service/src/types/events.types.ts`

```typescript
export enum TodoEventType {
  TODO_CREATED = 'TODO_CREATED',
  TODO_UPDATED = 'TODO_UPDATED',
  TODO_COMPLETED = 'TODO_COMPLETED',
  TODO_DELETED = 'TODO_DELETED',
}

export interface TodoEventMetadata {
  source: string;
  version: string;
  correlationId?: string;
}

export interface TodoCreatedData {
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string | null;
}

export interface TodoUpdatedData {
  title: string;
  description?: string | null;
  completed: boolean;
  dueDate?: string | null;
}

export interface TodoCompletedData {
  completed: boolean;
  completedAt: string;
}

export interface TodoDeletedData {
  // Empty for deleted events
}

export type TodoEventData =
  | TodoCreatedData
  | TodoUpdatedData
  | TodoCompletedData
  | TodoDeletedData;

export interface TodoEvent {
  eventId: string;
  eventType: TodoEventType;
  timestamp: string;
  userId: string;
  todoId: string;
  data: TodoEventData;
  metadata: TodoEventMetadata;
}
```

### 3.3 Create Kafka Configuration

File: `apps/services/todo-nodejs-service/src/config/kafka.ts`

```typescript
import { Kafka, Producer, logLevel } from 'kafkajs';

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'todo-nodejs-service';

let producer: Producer | null = null;

export const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: KAFKA_BROKERS,
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 300,
    retries: 3,
  },
});

export async function initKafkaProducer(): Promise<Producer> {
  if (producer) {
    return producer;
  }

  producer = kafka.producer({
    allowAutoTopicCreation: false,
    idempotent: true,
    maxInFlightRequests: 5,
    retry: {
      retries: 3,
      initialRetryTime: 300,
    },
  });

  await producer.connect();
  console.log('Kafka producer connected successfully');

  return producer;
}

export async function disconnectKafkaProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
    console.log('Kafka producer disconnected');
  }
}

export function getKafkaProducer(): Producer {
  if (!producer) {
    throw new Error('Kafka producer not initialized. Call initKafkaProducer first.');
  }
  return producer;
}
```

### 3.4 Create Event Publisher Service

File: `apps/services/todo-nodejs-service/src/services/event-publisher.service.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import { getKafkaProducer } from '../config/kafka';
import {
  TodoEvent,
  TodoEventType,
  TodoCreatedData,
  TodoUpdatedData,
  TodoCompletedData,
  TodoDeletedData,
} from '../types/events.types';

const KAFKA_TOPIC = process.env.KAFKA_TOPIC_TODO_EVENTS || 'todo-events';
const MOCK_USER_ID = process.env.MOCK_USER_ID || 'mock-user-123';
const SERVICE_NAME = 'todo-nodejs-service';
const EVENT_VERSION = '1.0';

export class EventPublisherService {
  private async publishEvent(event: TodoEvent): Promise<void> {
    try {
      const producer = getKafkaProducer();

      const message = {
        key: event.todoId,
        value: JSON.stringify(event),
        headers: {
          eventType: event.eventType,
          eventId: event.eventId,
          correlationId: event.metadata.correlationId || '',
        },
      };

      await producer.send({
        topic: KAFKA_TOPIC,
        messages: [message],
      });

      console.log(`Event published: ${event.eventType} for todo ${event.todoId}`, {
        eventId: event.eventId,
        eventType: event.eventType,
        todoId: event.todoId,
      });
    } catch (error) {
      console.error('Failed to publish event:', error);
      // Don't throw - log and continue (fire-and-forget pattern)
    }
  }

  async publishTodoCreated(
    todoId: string,
    title: string,
    description?: string,
    dueDate?: Date | null,
    correlationId?: string
  ): Promise<void> {
    const event: TodoEvent = {
      eventId: uuidv4(),
      eventType: TodoEventType.TODO_CREATED,
      timestamp: new Date().toISOString(),
      userId: MOCK_USER_ID,
      todoId,
      data: {
        title,
        description,
        completed: false,
        dueDate: dueDate?.toISOString() || null,
      } as TodoCreatedData,
      metadata: {
        source: SERVICE_NAME,
        version: EVENT_VERSION,
        correlationId,
      },
    };

    await this.publishEvent(event);
  }

  async publishTodoUpdated(
    todoId: string,
    title: string,
    description: string | null | undefined,
    completed: boolean,
    dueDate?: Date | null,
    correlationId?: string
  ): Promise<void> {
    const event: TodoEvent = {
      eventId: uuidv4(),
      eventType: TodoEventType.TODO_UPDATED,
      timestamp: new Date().toISOString(),
      userId: MOCK_USER_ID,
      todoId,
      data: {
        title,
        description,
        completed,
        dueDate: dueDate?.toISOString() || null,
      } as TodoUpdatedData,
      metadata: {
        source: SERVICE_NAME,
        version: EVENT_VERSION,
        correlationId,
      },
    };

    await this.publishEvent(event);
  }

  async publishTodoCompleted(
    todoId: string,
    completed: boolean,
    correlationId?: string
  ): Promise<void> {
    const event: TodoEvent = {
      eventId: uuidv4(),
      eventType: TodoEventType.TODO_COMPLETED,
      timestamp: new Date().toISOString(),
      userId: MOCK_USER_ID,
      todoId,
      data: {
        completed,
        completedAt: new Date().toISOString(),
      } as TodoCompletedData,
      metadata: {
        source: SERVICE_NAME,
        version: EVENT_VERSION,
        correlationId,
      },
    };

    await this.publishEvent(event);
  }

  async publishTodoDeleted(todoId: string, correlationId?: string): Promise<void> {
    const event: TodoEvent = {
      eventId: uuidv4(),
      eventType: TodoEventType.TODO_DELETED,
      timestamp: new Date().toISOString(),
      userId: MOCK_USER_ID,
      todoId,
      data: {} as TodoDeletedData,
      metadata: {
        source: SERVICE_NAME,
        version: EVENT_VERSION,
        correlationId,
      },
    };

    await this.publishEvent(event);
  }
}

export const eventPublisher = new EventPublisherService();
```

### 3.5 Update Server to Initialize Kafka

File: `apps/services/todo-nodejs-service/src/server.ts`

```typescript
import { buildApp } from './app';
import { initDatabase } from './config/database';
import { initKafkaProducer, disconnectKafkaProducer } from './config/kafka';
import dotenv from 'dotenv';

dotenv.config();

const PORT = Number(process.env.PORT || 3105);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  try {
    // Initialize database
    await initDatabase();

    // Initialize Kafka producer
    await initKafkaProducer();

    // Build and start app
    const app = buildApp();
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Todo service listening on http://${HOST}:${PORT}`);

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await disconnectKafkaProducer();
      await app.close();
      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
```

### 3.6 Update Controllers to Publish Events

File: `apps/services/todo-nodejs-service/src/controllers/todo.controller.ts`

```typescript
import { FastifyReply, FastifyRequest } from 'fastify';
import { TodoModel } from '../models/todo.model';
import { eventPublisher } from '../services/event-publisher.service';

export const listTodos = async (_req: FastifyRequest, reply: FastifyReply) => {
  const todos = await TodoModel.findAll();
  return reply.code(200).send({ success: true, data: todos });
};

export const getTodo = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const todo = await TodoModel.findById(req.params.id);
  if (!todo) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Todo not found', details: [] },
    });
  }
  return reply.code(200).send({ success: true, data: todo });
};

export const createTodo = async (
  req: FastifyRequest<{ Body: { title: string; description?: string } }>,
  reply: FastifyReply
) => {
  const { title, description } = req.body;
  const todo = await TodoModel.create(title, description);

  // Publish event after successful creation
  await eventPublisher.publishTodoCreated(
    todo.id,
    todo.title,
    todo.description,
    null,
    req.id
  );

  return reply.code(201).send({ success: true, data: todo });
};

export const updateTodo = async (
  req: FastifyRequest<{
    Params: { id: string };
    Body: { title: string; description?: string | null; completed: boolean };
  }>,
  reply: FastifyReply
) => {
  const updated = await TodoModel.update(req.params.id, req.body);
  if (!updated) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Todo not found', details: [] },
    });
  }

  // Publish event after successful update
  await eventPublisher.publishTodoUpdated(
    updated.id,
    updated.title,
    updated.description,
    updated.completed,
    null,
    req.id
  );

  return reply.code(200).send({ success: true, data: updated });
};

export const toggleTodo = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const toggled = await TodoModel.toggle(req.params.id);
  if (!toggled) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Todo not found', details: [] },
    });
  }

  // Publish completion event
  await eventPublisher.publishTodoCompleted(
    toggled.id,
    toggled.completed,
    req.id
  );

  return reply.code(200).send({ success: true, data: toggled });
};

export const deleteTodo = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const ok = await TodoModel.delete(req.params.id);
  if (!ok) {
    return reply.code(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Todo not found', details: [] },
    });
  }

  // Publish deletion event
  await eventPublisher.publishTodoDeleted(req.params.id, req.id);

  return reply.code(204).send();
};
```

### 3.7 Update Environment Variables

File: `apps/services/todo-nodejs-service/.env`

Add:
```bash
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=todo-nodejs-service
KAFKA_TOPIC_TODO_EVENTS=todo-events
MOCK_USER_ID=mock-user-123
```

### 3.8 Test Node.js Service

```bash
cd apps/services/todo-nodejs-service

# Start service
npm run dev

# In another terminal, test create todo
curl -X POST http://localhost:3105/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Kafka Event", "description": "Testing event publishing"}'

# Check Kafka messages
docker-compose exec kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic todo-events \
  --from-beginning \
  --property print.headers=true \
  --property print.timestamp=true

# Or check Kafka UI at http://localhost:8080
```

---

## STEP 4: Java Event Processor Service

### 4.1 Create Java Project Structure

```bash
mkdir -p apps/services/todo-event-processor-java
cd apps/services/todo-event-processor-java
```

### 4.2 Initialize Spring Boot Project

Use Spring Initializr or create manually:

```bash
# Using Maven wrapper
curl https://start.spring.io/starter.zip \
  -d dependencies=web,kafka,data-jpa,postgresql,actuator \
  -d bootVersion=3.2.0 \
  -d javaVersion=17 \
  -d groupId=com.polystack \
  -d artifactId=todo-event-processor \
  -d name=TodoEventProcessor \
  -d packageName=com.polystack.todoprocessor \
  -d packaging=jar \
  -o todo-event-processor.zip

unzip todo-event-processor.zip
rm todo-event-processor.zip
```

Or create files manually...

### 4.3 Create pom.xml

File: `apps/services/todo-event-processor-java/pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>

    <groupId>com.polystack</groupId>
    <artifactId>todo-event-processor</artifactId>
    <version>0.1.0</version>
    <name>TodoEventProcessor</name>
    <description>Event processor for Todo application using Kafka</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Kafka -->
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>

        <!-- Spring Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- PostgreSQL Driver -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Spring Boot Actuator -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Jackson for JSON -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>

        <!-- Lombok (optional) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Test Dependencies -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

### 4.4 Create Application Configuration

File: `apps/services/todo-event-processor-java/src/main/resources/application.yml`

```yaml
spring:
  application:
    name: todo-event-processor

  datasource:
    url: jdbc:postgresql://localhost:5432/todos
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
      connection-timeout: 30000

  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true

  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: todo-event-processor-group
      auto-offset-reset: earliest
      enable-auto-commit: false
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      properties:
        isolation.level: read_committed
        max.poll.records: 100
        session.timeout.ms: 30000
        heartbeat.interval.ms: 3000
    listener:
      ack-mode: manual

server:
  port: 8081

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always

app:
  kafka:
    topic: todo-events

logging:
  level:
    com.polystack.todoprocessor: INFO
    org.springframework.kafka: INFO
    org.hibernate.SQL: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
```

### 4.5 Create Main Application Class

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/TodoEventProcessorApplication.java`

```java
package com.polystack.todoprocessor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
public class TodoEventProcessorApplication {
    public static void main(String[] args) {
        SpringApplication.run(TodoEventProcessorApplication.class, args);
    }
}
```

### 4.6 Create DTO Classes

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/dto/TodoEventDto.java`

```java
package com.polystack.todoprocessor.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class TodoEventDto {
    @JsonProperty("eventId")
    private String eventId;

    @JsonProperty("eventType")
    private String eventType;

    @JsonProperty("timestamp")
    private String timestamp;

    @JsonProperty("userId")
    private String userId;

    @JsonProperty("todoId")
    private String todoId;

    @JsonProperty("data")
    private Map<String, Object> data;

    @JsonProperty("metadata")
    private Metadata metadata;

    public static class Metadata {
        @JsonProperty("source")
        private String source;

        @JsonProperty("version")
        private String version;

        @JsonProperty("correlationId")
        private String correlationId;

        // Getters and setters
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        public String getVersion() { return version; }
        public void setVersion(String version) { this.version = version; }
        public String getCorrelationId() { return correlationId; }
        public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
    }

    // Getters and setters
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTodoId() { return todoId; }
    public void setTodoId(String todoId) { this.todoId = todoId; }

    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }

    public Metadata getMetadata() { return metadata; }
    public void setMetadata(Metadata metadata) { this.metadata = metadata; }

    @Override
    public String toString() {
        return "TodoEventDto{" +
                "eventId='" + eventId + '\'' +
                ", eventType='" + eventType + '\'' +
                ", todoId='" + todoId + '\'' +
                '}';
    }
}
```

### 4.7 Create Entity Classes

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/entity/EventEntity.java`

```java
package com.polystack.todoprocessor.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "events")
public class EventEntity {
    @Id
    @Column(name = "event_id", columnDefinition = "UUID")
    private UUID eventId;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "aggregate_id", nullable = false, columnDefinition = "UUID")
    private UUID aggregateId;

    @Column(name = "user_id", nullable = false, columnDefinition = "UUID")
    private UUID userId;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "data", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> data;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    // Getters and setters
    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public UUID getAggregateId() { return aggregateId; }
    public void setAggregateId(UUID aggregateId) { this.aggregateId = aggregateId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Map<String, Object> getData() { return data; }
    public void setData(Map<String, Object> data) { this.data = data; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
```

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/entity/TodoEntity.java`

```java
package com.polystack.todoprocessor.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "todos")
public class TodoEntity {
    @Id
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "user_id", columnDefinition = "UUID")
    private UUID userId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description")
    private String description;

    @Column(name = "completed", nullable = false)
    private Boolean completed = false;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "version")
    private Integer version = 0;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (updatedAt == null) {
            updatedAt = Instant.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getCompleted() { return completed; }
    public void setCompleted(Boolean completed) { this.completed = completed; }

    public Instant getDueDate() { return dueDate; }
    public void setDueDate(Instant dueDate) { this.dueDate = dueDate; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
```

### 4.8 Create Repository Interfaces

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/repository/EventRepository.java`

```java
package com.polystack.todoprocessor.repository;

import com.polystack.todoprocessor.entity.EventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<EventEntity, UUID> {
    boolean existsByEventId(UUID eventId);
}
```

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/repository/TodoRepository.java`

```java
package com.polystack.todoprocessor.repository;

import com.polystack.todoprocessor.entity.TodoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TodoRepository extends JpaRepository<TodoEntity, UUID> {
}
```

### 4.9 Create Event Processor Service

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/service/EventProcessorService.java`

```java
package com.polystack.todoprocessor.service;

import com.polystack.todoprocessor.dto.TodoEventDto;
import com.polystack.todoprocessor.entity.EventEntity;
import com.polystack.todoprocessor.repository.EventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class EventProcessorService {
    private static final Logger logger = LoggerFactory.getLogger(EventProcessorService.class);

    private final EventRepository eventRepository;
    private final TodoProjectionService todoProjectionService;

    public EventProcessorService(EventRepository eventRepository, TodoProjectionService todoProjectionService) {
        this.eventRepository = eventRepository;
        this.todoProjectionService = todoProjectionService;
    }

    @Transactional
    public void processEvent(TodoEventDto eventDto) {
        try {
            UUID eventId = UUID.fromString(eventDto.getEventId());

            // Idempotency check
            if (eventRepository.existsByEventId(eventId)) {
                logger.warn("Duplicate event detected, skipping: {}", eventId);
                return;
            }

            // Store event in event store
            EventEntity eventEntity = createEventEntity(eventDto);
            eventRepository.save(eventEntity);
            logger.info("Event stored: {} - {}", eventDto.getEventType(), eventId);

            // Update projection based on event type
            switch (eventDto.getEventType()) {
                case "TODO_CREATED":
                    todoProjectionService.handleTodoCreated(eventDto);
                    break;
                case "TODO_UPDATED":
                    todoProjectionService.handleTodoUpdated(eventDto);
                    break;
                case "TODO_COMPLETED":
                    todoProjectionService.handleTodoCompleted(eventDto);
                    break;
                case "TODO_DELETED":
                    todoProjectionService.handleTodoDeleted(eventDto);
                    break;
                default:
                    logger.warn("Unknown event type: {}", eventDto.getEventType());
            }

            logger.info("Event processed successfully: {}", eventDto.getEventType());
        } catch (Exception e) {
            logger.error("Error processing event: {}", eventDto, e);
            throw new RuntimeException("Failed to process event", e);
        }
    }

    private EventEntity createEventEntity(TodoEventDto dto) {
        EventEntity entity = new EventEntity();
        entity.setEventId(UUID.fromString(dto.getEventId()));
        entity.setEventType(dto.getEventType());
        entity.setAggregateId(UUID.fromString(dto.getTodoId()));
        entity.setUserId(UUID.fromString(dto.getUserId()));
        entity.setTimestamp(Instant.parse(dto.getTimestamp()));
        entity.setData(dto.getData());
        entity.setVersion(1);
        return entity;
    }
}
```

### 4.10 Create Todo Projection Service

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/service/TodoProjectionService.java`

```java
package com.polystack.todoprocessor.service;

import com.polystack.todoprocessor.dto.TodoEventDto;
import com.polystack.todoprocessor.entity.TodoEntity;
import com.polystack.todoprocessor.repository.TodoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class TodoProjectionService {
    private static final Logger logger = LoggerFactory.getLogger(TodoProjectionService.class);

    private final TodoRepository todoRepository;

    public TodoProjectionService(TodoRepository todoRepository) {
        this.todoRepository = todoRepository;
    }

    public void handleTodoCreated(TodoEventDto event) {
        Map<String, Object> data = event.getData();

        TodoEntity todo = new TodoEntity();
        todo.setId(UUID.fromString(event.getTodoId()));
        todo.setUserId(UUID.fromString(event.getUserId()));
        todo.setTitle((String) data.get("title"));
        todo.setDescription((String) data.get("description"));
        todo.setCompleted((Boolean) data.getOrDefault("completed", false));

        if (data.get("dueDate") != null) {
            todo.setDueDate(Instant.parse((String) data.get("dueDate")));
        }

        todo.setVersion(1);
        todoRepository.save(todo);
        logger.info("Todo created in projection: {}", todo.getId());
    }

    public void handleTodoUpdated(TodoEventDto event) {
        UUID todoId = UUID.fromString(event.getTodoId());
        TodoEntity todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));

        Map<String, Object> data = event.getData();
        todo.setTitle((String) data.get("title"));
        todo.setDescription((String) data.get("description"));
        todo.setCompleted((Boolean) data.get("completed"));

        if (data.get("dueDate") != null) {
            todo.setDueDate(Instant.parse((String) data.get("dueDate")));
        } else {
            todo.setDueDate(null);
        }

        todo.setVersion(todo.getVersion() + 1);
        todoRepository.save(todo);
        logger.info("Todo updated in projection: {}", todoId);
    }

    public void handleTodoCompleted(TodoEventDto event) {
        UUID todoId = UUID.fromString(event.getTodoId());
        TodoEntity todo = todoRepository.findById(todoId)
                .orElseThrow(() -> new RuntimeException("Todo not found: " + todoId));

        Map<String, Object> data = event.getData();
        todo.setCompleted((Boolean) data.get("completed"));
        todo.setVersion(todo.getVersion() + 1);
        todoRepository.save(todo);
        logger.info("Todo completed status updated: {}", todoId);
    }

    public void handleTodoDeleted(TodoEventDto event) {
        UUID todoId = UUID.fromString(event.getTodoId());
        todoRepository.deleteById(todoId);
        logger.info("Todo deleted from projection: {}", todoId);
    }
}
```

### 4.11 Create Kafka Listener

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/listener/TodoEventListener.java`

```java
package com.polystack.todoprocessor.listener;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.polystack.todoprocessor.dto.TodoEventDto;
import com.polystack.todoprocessor.service.EventProcessorService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
public class TodoEventListener {
    private static final Logger logger = LoggerFactory.getLogger(TodoEventListener.class);

    private final EventProcessorService eventProcessorService;
    private final ObjectMapper objectMapper;

    public TodoEventListener(EventProcessorService eventProcessorService) {
        this.eventProcessorService = eventProcessorService;
        this.objectMapper = new ObjectMapper();
    }

    @KafkaListener(
        topics = "${app.kafka.topic}",
        groupId = "${spring.kafka.consumer.group-id}",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void listen(
            @Payload String message,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment
    ) {
        logger.info("Received message from partition {} at offset {}", partition, offset);

        try {
            // Deserialize JSON to DTO
            TodoEventDto eventDto = objectMapper.readValue(message, TodoEventDto.class);
            logger.info("Processing event: {}", eventDto);

            // Process the event
            eventProcessorService.processEvent(eventDto);

            // Manually commit offset
            if (acknowledgment != null) {
                acknowledgment.acknowledge();
                logger.debug("Offset committed: {}", offset);
            }
        } catch (Exception e) {
            logger.error("Error processing message at offset {}: {}", offset, message, e);
            // For Phase 1: Log error and acknowledge to skip bad message
            // Phase 4 will add DLQ (Dead Letter Queue)
            if (acknowledgment != null) {
                acknowledgment.acknowledge();
            }
        }
    }
}
```

### 4.12 Create Kafka Configuration

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/config/KafkaConsumerConfig.java`

```java
package com.polystack.todoprocessor.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class KafkaConsumerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String bootstrapServers;

    @Value("${spring.kafka.consumer.group-id}")
    private String groupId;

    @Bean
    public ConsumerFactory<String, String> consumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 30000);
        props.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 3000);
        props.put(ConsumerConfig.ISOLATION_LEVEL_CONFIG, "read_committed");

        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
        return factory;
    }
}
```

### 4.13 Create Health Check Controller (Optional)

File: `apps/services/todo-event-processor-java/src/main/java/com/polystack/todoprocessor/controller/HealthController.java`

```java
package com.polystack.todoprocessor.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("service", "todo-event-processor");
        response.put("version", "0.1.0");
        return response;
    }
}
```

### 4.14 Create Nx project.json

File: `apps/services/todo-event-processor-java/project.json`

```json
{
  "name": "todo-event-processor-java",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/services/todo-event-processor-java/src",
  "projectType": "application",
  "tags": ["type:service", "lang:java", "scope:backend"],
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./mvnw clean package -DskipTests",
        "cwd": "apps/services/todo-event-processor-java"
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./mvnw spring-boot:run",
        "cwd": "apps/services/todo-event-processor-java"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "./mvnw test",
        "cwd": "apps/services/todo-event-processor-java"
      }
    }
  }
}
```

### 4.15 Build and Run Java Service

```bash
cd apps/services/todo-event-processor-java

# Make Maven wrapper executable
chmod +x mvnw

# Build
./mvnw clean package -DskipTests

# Run
./mvnw spring-boot:run

# Or with Nx
nx serve todo-event-processor-java

# Check logs
tail -f logs/spring.log

# Check health
curl http://localhost:8081/health
curl http://localhost:8081/actuator/health
```

---

## STEP 5: End-to-End Testing

### 5.1 Start All Services

Terminal 1 - Infrastructure:
```bash
cd tools/local-dev
docker-compose up -d
docker-compose logs -f kafka
```

Terminal 2 - Node.js Service:
```bash
cd apps/services/todo-nodejs-service
npm run dev
```

Terminal 3 - Java Service:
```bash
cd apps/services/todo-event-processor-java
./mvnw spring-boot:run
```

### 5.2 Test Create Todo

```bash
# Create todo
curl -X POST http://localhost:3105/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn Kafka Event Sourcing",
    "description": "Implement Phase 1 of the todo system"
  }' | jq

# Expected response:
# {
#   "success": true,
#   "data": {
#     "id": "...",
#     "title": "Learn Kafka Event Sourcing",
#     "description": "Implement Phase 1 of the todo system",
#     "completed": false,
#     "createdAt": "...",
#     "updatedAt": "..."
#   }
# }

# Save the todo ID for next tests
TODO_ID="<copy-id-from-response>"
```

### 5.3 Verify Event in Kafka

```bash
# Check Kafka UI: http://localhost:8080
# Navigate to Topics → todo-events → Messages

# Or use console consumer
docker-compose exec kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic todo-events \
  --from-beginning \
  --property print.headers=true \
  --max-messages 10
```

### 5.4 Verify Event in Database

```bash
# Check events table
docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT event_id, event_type, aggregate_id, timestamp FROM events ORDER BY timestamp DESC LIMIT 5;"

# Check todos table
docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT id, title, completed, user_id, version FROM todos ORDER BY created_at DESC LIMIT 5;"
```

### 5.5 Test Update Todo

```bash
curl -X PUT http://localhost:3105/todos/$TODO_ID \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Master Kafka Event Sourcing",
    "description": "Updated description",
    "completed": false
  }' | jq

# Verify in database
docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT * FROM events WHERE event_type='TODO_UPDATED' ORDER BY timestamp DESC LIMIT 1;"
```

### 5.6 Test Complete Todo

```bash
curl -X PATCH http://localhost:3105/todos/$TODO_ID/toggle | jq

# Verify
docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT * FROM todos WHERE id='$TODO_ID';"
```

### 5.7 Test Delete Todo

```bash
curl -X DELETE http://localhost:3105/todos/$TODO_ID

# Verify deletion
docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT * FROM events WHERE event_type='TODO_DELETED' ORDER BY timestamp DESC LIMIT 1;"

docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT * FROM todos WHERE id='$TODO_ID';"
# Should return 0 rows
```

### 5.8 Test Idempotency

Replay same event to verify idempotency:

```bash
# Get an event from events table
docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT event_id FROM events LIMIT 1;"

# Check count before
docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT COUNT(*) FROM events;"

# Manually publish duplicate (requires kafka-console-producer or code modification)
# For now, verify in Java logs that duplicate events are skipped

# Check Java service logs for "Duplicate event detected, skipping" message
```

### 5.9 Performance Test

Create multiple todos rapidly:

```bash
# Bash loop to create 50 todos
for i in {1..50}; do
  curl -X POST http://localhost:3105/todos \
    -H "Content-Type: application/json" \
    -d "{\"title\": \"Todo $i\", \"description\": \"Performance test todo $i\"}" \
    -s -o /dev/null -w "%{http_code}\n"
  sleep 0.1
done

# Check consumer lag
docker-compose exec kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group todo-event-processor-group \
  --describe

# Verify count in database
docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT COUNT(*) FROM events;"

docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT COUNT(*) FROM todos;"
```

### 5.10 Verify Health Endpoints

```bash
# Node.js service health
curl http://localhost:3105/health | jq

# Java service health
curl http://localhost:8081/health | jq
curl http://localhost:8081/actuator/health | jq

# Kafka UI
# Browser: http://localhost:8080
```

---

## STEP 6: Verification Checklist

Run through this checklist:

```bash
# 1. Kafka broker running
docker-compose ps kafka
# Status should be "Up (healthy)"

# 2. Kafka UI accessible
curl -s http://localhost:8080 | grep -q "Kafka" && echo "OK" || echo "FAIL"

# 3. Topic exists with 3 partitions
docker-compose exec kafka kafka-topics.sh --describe --topic todo-events --bootstrap-server localhost:9092

# 4. Node.js service running
curl -s http://localhost:3105/health | jq -r '.status' | grep -q "healthy" && echo "OK" || echo "FAIL"

# 5. Java service running
curl -s http://localhost:8081/health | jq -r '.status' | grep -q "healthy" && echo "OK" || echo "FAIL"

# 6. Database tables exist
docker-compose exec postgres psql -U postgres -d todos -c "\dt" | grep -E "events|todos"

# 7. Consumer group active
docker-compose exec kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group todo-event-processor-group \
  --describe | grep "todo-events"

# 8. Create and verify full flow
TODO_ID=$(curl -s -X POST http://localhost:3105/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Verification Test"}' | jq -r '.data.id')

sleep 2

# Verify event stored
docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT COUNT(*) FROM events WHERE aggregate_id='$TODO_ID';" | grep -q "1" && echo "Events OK"

# Verify todo created
docker-compose exec postgres psql -U postgres -d todos -c \
  "SELECT COUNT(*) FROM todos WHERE id='$TODO_ID';" | grep -q "1" && echo "Todos OK"

# 9. Check consumer lag < 100 messages
docker-compose exec kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group todo-event-processor-group \
  --describe

# 10. No critical errors in logs
docker-compose logs kafka | grep -i error | grep -v "WARN" | wc -l
# Should be 0 or very low

echo "✅ Phase 1 verification complete!"
```

---

## STEP 7: Cleanup and Documentation

### 7.1 Create README for Node.js Service

File: `apps/services/todo-nodejs-service/README.md`

```markdown
# TODO Node.js Service

Event-driven TODO service using Fastify and Kafka.

## Quick Start

npm install
npm run dev

## Environment Variables

DB_HOST=localhost
DB_PORT=5432
DB_NAME=todos
DB_USER=postgres
DB_PASSWORD=postgres
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_TODO_EVENTS=todo-events
MOCK_USER_ID=mock-user-123

## API Endpoints

- POST /todos - Create todo
- GET /todos - List todos
- GET /todos/:id - Get todo
- PUT /todos/:id - Update todo
- PATCH /todos/:id/toggle - Toggle completion
- DELETE /todos/:id - Delete todo
- GET /health - Health check

## Events Published

- TODO_CREATED
- TODO_UPDATED
- TODO_COMPLETED
- TODO_DELETED
```

### 7.2 Create README for Java Service

File: `apps/services/todo-event-processor-java/README.md`

```markdown
# TODO Event Processor (Java)

Spring Boot service that consumes TODO events from Kafka and updates PostgreSQL.

## Build

./mvnw clean package

## Run

./mvnw spring-boot:run

## Configuration

See src/main/resources/application.yml

## Consumer Group

Group ID: todo-event-processor-group
Topic: todo-events
Partitions: 3
```

### 7.3 Stop Services Gracefully

```bash
# Stop Java service (Ctrl+C in terminal)

# Stop Node.js service (Ctrl+C in terminal)

# Stop Docker containers
cd tools/local-dev
docker-compose down

# Or keep running for Phase 2
docker-compose stop
```

---

## TROUBLESHOOTING REFERENCE

### Issue: Kafka fails to start

**Solution:**
```bash
# Remove old volumes
docker-compose down -v
docker volume prune

# Restart
docker-compose up -d kafka
```

### Issue: Node.js can't connect to Kafka

**Solution:**
```bash
# Check Kafka is listening
docker-compose exec kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# Verify .env KAFKA_BROKERS=localhost:9092
cat apps/services/todo-nodejs-service/.env | grep KAFKA

# Restart Node.js service
```

### Issue: Java service can't deserialize events

**Solution:**
```bash
# Check event format in Kafka
docker-compose exec kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic todo-events \
  --from-beginning \
  --max-messages 1

# Verify JSON matches TodoEventDto structure
# Check Java logs for deserialization errors
```

### Issue: Events not consumed

**Solution:**
```bash
# Check consumer group
docker-compose exec kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe \
  --group todo-event-processor-group

# Reset offset if needed
docker-compose exec kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group todo-event-processor-group \
  --reset-offsets \
  --to-earliest \
  --topic todo-events \
  --execute
```

### Issue: Database connection failed

**Solution:**
```bash
# Check PostgreSQL running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U postgres -d todos -c "SELECT 1;"

# Verify credentials in .env and application.yml match
```

---

## COMPLETION CRITERIA

Phase 1 is complete when ALL of these pass:

- [ ] `docker-compose ps` shows kafka and postgres healthy
- [ ] `curl http://localhost:8080` returns Kafka UI
- [ ] `curl http://localhost:3105/health` returns status healthy
- [ ] `curl http://localhost:8081/health` returns status healthy
- [ ] Creating a todo via POST returns 201
- [ ] Event appears in Kafka topic within 1 second
- [ ] Event appears in events table within 2 seconds
- [ ] Todo appears in todos table within 2 seconds
- [ ] Updating todo publishes TODO_UPDATED event
- [ ] Deleting todo publishes TODO_DELETED and removes from todos table
- [ ] Consumer lag < 100 under normal load
- [ ] No errors in Java service logs (except handled errors)
- [ ] Idempotency test: replaying event doesn't create duplicate

---

## NEXT PHASE

Phase 2: Real-time Collaboration
- WebSocket Gateway Service (Node.js or Java)
- Frontend integration
- Live updates across clients
- Multi-user support

---

**END OF PHASE 1 IMPLEMENTATION GUIDE**
