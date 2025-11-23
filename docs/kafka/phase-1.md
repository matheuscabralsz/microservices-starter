# Phase 1: Event Sourcing Foundation

## Overview

Phase 1 establishes the core event-driven architecture for the TODO application using Kafka as the event streaming backbone. This phase transforms the existing Node.js CRUD service into an event-sourcing system and implements a Java Spring Boot service to consume and process events.

**Duration Estimate**: 2-3 weeks
**Complexity**: Medium
**Status**: Not Started

## Goals

1. Set up Apache Kafka infrastructure (KRaft mode)
2. Integrate Kafka producer into existing Node.js TODO service
3. Implement Java Spring Boot Event Processor service
4. Establish event sourcing pattern with PostgreSQL event store
5. Maintain current state projection in PostgreSQL
6. Ensure end-to-end event flow from API to database

## Architecture Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────────┐
│   Client    │         │              │         │                     │
│  (Postman)  │────────▶│  Node.js API │────────▶│   Kafka (KRaft)     │
│             │  HTTP   │   (Express/  │  Publish│   Topic:            │
└─────────────┘         │   Fastify)   │  Events │   todo-events       │
                        │              │         │                     │
                        └──────────────┘         └──────────┬──────────┘
                               │                            │
                               │ Direct DB Write            │ Consume
                               │ (Optional)                 │ Events
                               ▼                            ▼
                        ┌──────────────┐         ┌─────────────────────┐
                        │  PostgreSQL  │◀────────│  Java Event         │
                        │              │  Write  │  Processor          │
                        │ - todos      │  Events │  (Spring Boot)      │
                        │ - events     │   &     │                     │
                        │              │  State  │  @KafkaListener     │
                        └──────────────┘         └─────────────────────┘
```

## Technology Stack

- **Apache Kafka**: 3.8+ (KRaft mode, no Zookeeper)
- **Node.js**: 20.x LTS
- **Java**: 17 LTS
- **Spring Boot**: 3.2+
- **Spring Kafka**: 3.1+
- **PostgreSQL**: 15+
- **Docker & Docker Compose**: For local development
- **KafkaJS**: Kafka client for Node.js
- **Fastify**: Existing web framework

## Database Schema

### Event Store Table

```sql
CREATE TABLE events (
    event_id UUID PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    aggregate_id UUID NOT NULL,  -- todo_id
    user_id UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    data JSONB NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Indexes for efficient querying
    INDEX idx_aggregate_id (aggregate_id),
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type),
    INDEX idx_timestamp (timestamp)
);
```

### Current State Projection Table

```sql
-- Update existing todos table
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;

-- Add index for user_id
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
```

## Event Schema Specification

All events published to Kafka follow this structure:

```typescript
interface TodoEvent {
  eventId: string;           // UUID v4
  eventType: TodoEventType;  // Enum of event types
  timestamp: string;         // ISO8601 format
  userId: string;            // UUID (mocked for Phase 1)
  todoId: string;            // UUID of the todo
  data: EventData;           // Event-specific payload
  metadata: {
    correlationId?: string;  // For distributed tracing
    source: string;          // Service that emitted event
    version: string;         // Schema version
  };
}

enum TodoEventType {
  TODO_CREATED = 'TODO_CREATED',
  TODO_UPDATED = 'TODO_UPDATED',
  TODO_COMPLETED = 'TODO_COMPLETED',
  TODO_DELETED = 'TODO_DELETED'
}
```

### Event Type Payloads

**TODO_CREATED**
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "TODO_CREATED",
  "timestamp": "2025-11-22T10:30:00.000Z",
  "userId": "mock-user-123",
  "todoId": "650e8400-e29b-41d4-a716-446655440001",
  "data": {
    "title": "Learn Kafka",
    "description": "Implement event sourcing with Spring Boot",
    "completed": false,
    "dueDate": null
  },
  "metadata": {
    "source": "todo-nodejs-service",
    "version": "1.0",
    "correlationId": "req-abc123"
  }
}
```

**TODO_UPDATED**
```json
{
  "eventId": "...",
  "eventType": "TODO_UPDATED",
  "timestamp": "...",
  "userId": "mock-user-123",
  "todoId": "650e8400-e29b-41d4-a716-446655440001",
  "data": {
    "title": "Master Kafka Streams",
    "description": "Updated description",
    "completed": false,
    "dueDate": "2025-12-01T00:00:00.000Z"
  },
  "metadata": { ... }
}
```

**TODO_COMPLETED**
```json
{
  "eventId": "...",
  "eventType": "TODO_COMPLETED",
  "timestamp": "...",
  "userId": "mock-user-123",
  "todoId": "650e8400-e29b-41d4-a716-446655440001",
  "data": {
    "completed": true,
    "completedAt": "2025-11-22T14:30:00.000Z"
  },
  "metadata": { ... }
}
```

**TODO_DELETED**
```json
{
  "eventId": "...",
  "eventType": "TODO_DELETED",
  "timestamp": "...",
  "userId": "mock-user-123",
  "todoId": "650e8400-e29b-41d4-a716-446655440001",
  "data": {},
  "metadata": { ... }
}
```

## Kafka Configuration

### Topic Configuration

**Topic**: `todo-events`
- **Partitions**: 3 (for learning partitioning strategies)
- **Replication Factor**: 1 (single broker in development)
- **Retention**: 7 days (168 hours)
- **Cleanup Policy**: Delete
- **Min In-Sync Replicas**: 1

### Producer Configuration (Node.js)

```yaml
client.id: todo-nodejs-service
acks: all                    # Wait for all replicas
compression: gzip            # Compress messages
idempotence: true            # Prevent duplicate messages
retry.max: 3
retry.timeout: 30000
request.timeout: 30000
```

### Consumer Configuration (Java)

```yaml
group.id: todo-event-processor-group
auto.offset.reset: earliest
enable.auto.commit: false    # Manual commit for reliability
max.poll.records: 100
session.timeout: 30000
heartbeat.interval: 3000
isolation.level: read_committed
```

## Implementation Tasks

### Task 1: Docker Compose Infrastructure Setup

**Objective**: Set up Kafka in KRaft mode with PostgreSQL

**Files to Create/Modify**:
- `tools/local-dev/docker-compose.yml` (extend existing)
- `tools/local-dev/kafka/kraft-config.properties`

**Steps**:
1. Add Kafka broker service (KRaft mode)
2. Configure Kafka UI for monitoring (optional but recommended)
3. Ensure PostgreSQL service exists
4. Add health checks for all services
5. Create initialization script for Kafka topics

**Docker Services**:
- `kafka-broker` (KRaft mode, port 9092)
- `kafka-ui` (optional, port 8080)
- `postgres` (existing, port 5432)

**Verification**:
```bash
docker-compose up -d
docker-compose ps  # All services healthy
docker-compose exec kafka-broker kafka-topics.sh --list --bootstrap-server localhost:9092
```

### Task 2: Database Migration

**Objective**: Add event store table and update todos schema

**Files to Create**:
- `apps/services/todo-nodejs-service/migrations/001_create_events_table.sql`
- `apps/services/todo-nodejs-service/migrations/002_update_todos_table.sql`

**Steps**:
1. Create `events` table with proper indexes
2. Add `user_id`, `due_date`, `version` to `todos` table
3. Create migration runner script
4. Add sample data seeding script (optional)

**Verification**:
```bash
psql -h localhost -U postgres -d todos -c "\dt"  # Check tables exist
psql -h localhost -U postgres -d todos -c "\d events"  # Check schema
```

### Task 3: Node.js Kafka Producer Integration

**Objective**: Integrate KafkaJS into existing TODO service

**Files to Create/Modify**:
- `apps/services/todo-nodejs-service/src/config/kafka.ts` (new)
- `apps/services/todo-nodejs-service/src/services/event-publisher.service.ts` (new)
- `apps/services/todo-nodejs-service/src/types/events.types.ts` (new)
- `apps/services/todo-nodejs-service/src/controllers/todo.controller.ts` (modify)
- `apps/services/todo-nodejs-service/package.json` (add kafkajs)

**Implementation Steps**:

1. **Install Dependencies**
   ```bash
   npm install kafkajs
   npm install --save-dev @types/kafkajs
   ```

2. **Create Kafka Configuration Module**
   - Initialize KafkaJS client
   - Configure producer with idempotence
   - Handle connection lifecycle
   - Add graceful shutdown

3. **Create Event Publisher Service**
   - `publishTodoCreated()`
   - `publishTodoUpdated()`
   - `publishTodoCompleted()`
   - `publishTodoDeleted()`
   - Event schema validation
   - Error handling and logging

4. **Update Controllers**
   - Modify `createTodo()` to publish TODO_CREATED event
   - Modify `updateTodo()` to publish TODO_UPDATED event
   - Modify `toggleTodo()` to publish TODO_COMPLETED event
   - Modify `deleteTodo()` to publish TODO_DELETED event
   - Ensure events are published AFTER database writes
   - Mock `userId` as constant (e.g., "mock-user-123")

5. **Add Health Check Endpoint**
   - `/health` endpoint to check Kafka connectivity
   - Return Kafka broker status

**Key Implementation Points**:
- Use fire-and-forget pattern (don't wait for Kafka acknowledgment)
- Log events being published for debugging
- Include correlation IDs from request headers
- Add basic error handling (log but don't fail request)

**Verification**:
```bash
# Start service
npm run dev

# Create a todo
curl -X POST http://localhost:3105/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Event", "description": "Testing Kafka"}'

# Check Kafka UI or CLI
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic todo-events --from-beginning
```

### Task 4: Java Event Processor Service

**Objective**: Create Spring Boot microservice to consume and process events

**Project Structure**:
```
apps/services/todo-event-processor-java/
├── src/main/java/com/polystack/todoprocessor/
│   ├── TodoEventProcessorApplication.java
│   ├── config/
│   │   ├── KafkaConsumerConfig.java
│   │   └── DatabaseConfig.java
│   ├── dto/
│   │   └── TodoEventDto.java
│   ├── entity/
│   │   ├── TodoEntity.java
│   │   └── EventEntity.java
│   ├── repository/
│   │   ├── TodoRepository.java
│   │   └── EventRepository.java
│   ├── service/
│   │   ├── EventProcessorService.java
│   │   └── TodoProjectionService.java
│   └── listener/
│       └── TodoEventListener.java
├── src/main/resources/
│   ├── application.yml
│   └── application-local.yml
├── Dockerfile
├── pom.xml (Maven) or build.gradle (Gradle)
└── project.json (Nx configuration)
```

**Dependencies (Maven)**:
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.kafka</groupId>
        <artifactId>spring-kafka</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-actuator</artifactId>
    </dependency>
    <dependency>
        <groupId>com.fasterxml.jackson.core</groupId>
        <artifactId>jackson-databind</artifactId>
    </dependency>
</dependencies>
```

**Implementation Steps**:

1. **Initialize Spring Boot Project**
   - Use Spring Initializr or Nx generator
   - Configure Nx integration (`project.json`)
   - Set up multi-module build if needed

2. **Configure Kafka Consumer**
   - Set up `@EnableKafka` in main application
   - Configure consumer properties in `application.yml`
   - Set consumer group ID: `todo-event-processor-group`
   - Enable manual offset commit
   - Configure error handling strategy

3. **Create JPA Entities**
   - `TodoEntity` for current state projection
   - `EventEntity` for event store
   - Use UUID for primary keys
   - Add proper relationships and indexes

4. **Implement Repositories**
   - `TodoRepository extends JpaRepository<TodoEntity, UUID>`
   - `EventRepository extends JpaRepository<EventEntity, UUID>`
   - Add custom query methods if needed

5. **Implement Event Listener**
   - Use `@KafkaListener` annotation
   - Listen to `todo-events` topic
   - Deserialize JSON to `TodoEventDto`
   - Delegate to `EventProcessorService`
   - Handle deserialization errors
   - Manual offset commit on success

6. **Implement Event Processor Service**
   - Store raw event in `events` table
   - Route to appropriate handler based on `eventType`
   - Implement idempotency check (prevent duplicate processing)
   - Use `@Transactional` for atomicity
   - Handle version conflicts

7. **Implement Todo Projection Service**
   - `handleTodoCreated()`: Insert new todo
   - `handleTodoUpdated()`: Update existing todo
   - `handleTodoCompleted()`: Mark as completed
   - `handleTodoDeleted()`: Soft or hard delete
   - Update version number for optimistic locking

8. **Add REST Endpoints (Optional)**
   - `GET /api/todos` - Query current state
   - `GET /api/todos/{id}` - Get single todo
   - `GET /api/events/{todoId}` - Get event history
   - `GET /health` - Health check endpoint

9. **Configure Logging**
   - Log all consumed events (INFO level)
   - Log processing errors (ERROR level)
   - Include correlation IDs in logs
   - Use structured logging (JSON format)

**Key Implementation Patterns**:

- **Event Deduplication**: Check if `eventId` already exists in `events` table
- **Transaction Management**: Use Spring `@Transactional` to ensure event storage + projection update are atomic
- **Error Handling**: Log errors and continue processing (don't crash consumer)
- **Idempotency**: Same event processed multiple times should produce same result

**Verification**:
```bash
# Build Java service
cd apps/services/todo-event-processor-java
./mvnw clean package

# Run service
java -jar target/todo-event-processor-java-0.1.0.jar

# Or with Nx
nx serve todo-event-processor-java

# Check logs for consumed events
tail -f logs/application.log | grep "Event received"

# Verify database
psql -h localhost -U postgres -d todos -c "SELECT * FROM events ORDER BY timestamp DESC LIMIT 5;"
psql -h localhost -U postgres -d todos -c "SELECT * FROM todos;"
```

### Task 5: End-to-End Testing

**Objective**: Verify complete event flow

**Test Scenarios**:

1. **Create Todo Test**
   ```bash
   # Step 1: Create todo via Node.js API
   curl -X POST http://localhost:3105/todos \
     -H "Content-Type: application/json" \
     -d '{"title": "E2E Test", "description": "Testing complete flow"}'

   # Step 2: Verify event in Kafka
   # Check Kafka UI at http://localhost:8080
   # Or use console consumer

   # Step 3: Wait 2-3 seconds for Java processor

   # Step 4: Verify event in events table
   psql -c "SELECT * FROM events WHERE event_type='TODO_CREATED' ORDER BY timestamp DESC LIMIT 1;"

   # Step 5: Verify todo in todos table
   psql -c "SELECT * FROM todos ORDER BY created_at DESC LIMIT 1;"
   ```

2. **Update Todo Test**
   ```bash
   curl -X PUT http://localhost:3105/todos/{id} \
     -H "Content-Type: application/json" \
     -d '{"title": "Updated Title", "description": "Updated", "completed": false}'
   ```

3. **Complete Todo Test**
   ```bash
   curl -X PATCH http://localhost:3105/todos/{id}/toggle
   ```

4. **Delete Todo Test**
   ```bash
   curl -X DELETE http://localhost:3105/todos/{id}
   ```

5. **Idempotency Test**
   - Process same event twice
   - Verify only one record in database

6. **Event Ordering Test**
   - Create multiple events rapidly
   - Verify they are processed in order

**Verification Checklist**:
- [ ] Kafka broker is running and healthy
- [ ] Node.js service publishes events successfully
- [ ] Events appear in Kafka topic
- [ ] Java service consumes events without errors
- [ ] Events are stored in `events` table
- [ ] Todo state is updated in `todos` table
- [ ] Health endpoints return 200 OK
- [ ] Logs show structured JSON output
- [ ] Correlation IDs are preserved

### Task 6: Documentation & Cleanup

**Objective**: Document setup and clean up code

**Deliverables**:

1. **README.md** for Node.js service
   - Quick start guide
   - Environment variables
   - Kafka event schema
   - API endpoints

2. **README.md** for Java service
   - Build instructions
   - Configuration guide
   - Consumer group information
   - Troubleshooting

3. **Architecture Diagram**
   - Update with actual implementation
   - Include Kafka topic details
   - Show data flow

4. **Code Cleanup**
   - Remove unused code
   - Add proper TypeScript/Java types
   - Fix linting errors
   - Add unit tests (optional for Phase 1)

## Configuration Management

### Environment Variables

**Node.js Service** (`.env`)
```bash
# Server
PORT=3105
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todos
DB_USER=postgres
DB_PASSWORD=postgres

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=todo-nodejs-service
KAFKA_TOPIC_TODO_EVENTS=todo-events

# Mock User
MOCK_USER_ID=mock-user-123
```

**Java Service** (`application.yml`)
```yaml
spring:
  application:
    name: todo-event-processor
  datasource:
    url: jdbc:postgresql://localhost:5432/todos
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: todo-event-processor-group
      auto-offset-reset: earliest
      enable-auto-commit: false
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer

server:
  port: 8081

app:
  kafka:
    topic: todo-events
```

## Monitoring & Observability

### Logging Strategy

**Node.js**:
- Use `pino` logger for structured JSON logs
- Log level: INFO in production, DEBUG in development
- Include correlation IDs, event types, todo IDs

**Java**:
- Use `logback` with JSON encoder
- Log level: INFO
- Include MDC (Mapped Diagnostic Context) for correlation IDs

### Kafka Monitoring

- **Kafka UI**: http://localhost:8080
  - Monitor topic lag
  - View messages in topics
  - Check consumer group offsets

- **Metrics to Watch**:
  - Consumer lag (should be near 0)
  - Messages per second
  - Failed message count

### Health Checks

**Node.js**: `GET /health`
```json
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "kafka": "connected"
  }
}
```

**Java**: `GET /actuator/health`
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "kafka": {"status": "UP"}
  }
}
```

## Error Handling

### Producer Errors (Node.js)

- **Connection Failure**: Log error, return success to client (eventual consistency)
- **Publish Timeout**: Retry up to 3 times, log if all fail
- **Invalid Event Schema**: Log validation error, don't publish

### Consumer Errors (Java)

- **Deserialization Error**: Log error, skip message, commit offset
- **Database Error**: Log error, retry up to 3 times, move to DLQ (Phase 4)
- **Duplicate Event**: Log warning, skip processing, commit offset
- **Connection Lost**: Kafka will rebalance, consumer will reconnect

## Known Limitations & Trade-offs

1. **No DLQ Yet**: Failed messages are logged but not retried (Phase 4)
2. **No Schema Registry**: Using plain JSON, no schema evolution support
3. **Single Broker**: Not production-ready (single point of failure)
4. **Mocked User**: No real authentication/authorization
5. **Eventual Consistency**: Node.js may return success before event is processed
6. **No Read Optimization**: Queries still go to write database (CQRS in later phase)

## Success Criteria

Phase 1 is complete when:

- [ ] Kafka cluster running in KRaft mode
- [ ] Node.js service publishes events to `todo-events` topic
- [ ] Java service consumes and processes all event types
- [ ] Events stored in `events` table
- [ ] Todo state updated in `todos` table
- [ ] End-to-end tests pass for all CRUD operations
- [ ] Health checks return healthy status
- [ ] Documentation complete and accurate
- [ ] No critical bugs or data loss
- [ ] Consumer lag < 100ms under normal load

## Next Steps (Phase 2 Preview)

After completing Phase 1, Phase 2 will add:

- **WebSocket Gateway Service**: Real-time updates to frontend
- **Multi-client Collaboration**: See changes from other users instantly
- **Frontend Integration**: React/Angular/Vue client with WebSocket
- **Optimistic UI Updates**: Immediate feedback with eventual consistency

## Troubleshooting Guide

### Kafka Connection Issues

**Symptom**: Node.js can't connect to Kafka
```
Error: Failed to connect to broker
```

**Solution**:
1. Check Docker containers: `docker-compose ps`
2. Verify Kafka is listening: `nc -zv localhost 9092`
3. Check firewall rules
4. Verify `KAFKA_BROKERS` environment variable

### Java Consumer Not Receiving Events

**Symptom**: Events published but not consumed

**Solution**:
1. Check consumer group status:
   ```bash
   kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
     --group todo-event-processor-group --describe
   ```
2. Verify topic exists and has messages
3. Check Java service logs for errors
4. Verify consumer configuration (group ID, offset reset)

### Database Connection Errors

**Symptom**: Cannot connect to PostgreSQL

**Solution**:
1. Check PostgreSQL container: `docker-compose ps postgres`
2. Verify credentials in `.env` and `application.yml`
3. Test connection: `psql -h localhost -U postgres -d todos`
4. Check database exists: `psql -l`

### Event Duplication

**Symptom**: Same event processed multiple times

**Solution**:
1. Verify idempotency logic in `EventProcessorService`
2. Check if `eventId` is unique in `events` table
3. Ensure manual offset commit is working
4. Review transaction boundaries

## Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Spring Kafka Reference](https://docs.spring.io/spring-kafka/reference/html/)
- [Event Sourcing Pattern](https://microservices.io/patterns/data/event-sourcing.html)
- [CQRS Pattern](https://microservices.io/patterns/data/cqrs.html)

## Appendix

### Sample Kafka Topic Creation Script

```bash
#!/bin/bash
KAFKA_BROKER="localhost:9092"

kafka-topics.sh --create \
  --bootstrap-server $KAFKA_BROKER \
  --topic todo-events \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000 \
  --config cleanup.policy=delete

kafka-topics.sh --describe \
  --bootstrap-server $KAFKA_BROKER \
  --topic todo-events
```

### Sample Database Migration Script

```bash
#!/bin/bash
PGHOST=localhost
PGPORT=5432
PGDATABASE=todos
PGUSER=postgres

psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f migrations/001_create_events_table.sql
psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -f migrations/002_update_todos_table.sql

echo "Migrations completed successfully!"
```

---

**Document Version**: 1.0
**Last Updated**: 2025-11-22
**Author**: Claude Code
**Status**: Ready for Implementation
