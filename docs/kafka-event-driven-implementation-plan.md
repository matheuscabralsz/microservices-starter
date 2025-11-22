# Kafka Event-Driven Microservices - Implementation Plan

**Project**: PolyStack Todo Application Event-Driven Architecture
**Current Service**: `apps/services/todo-nodejs-service` (Node.js/Fastify)
**New Service**: `apps/services/event-processor-java-service` (Java/Spring Boot)
**Purpose**: Learn Kafka and event-driven patterns through progressive implementation

---

## Overview

Transform the simple CRUD todo application into an event-driven microservices architecture using Apache Kafka. Each phase builds upon the previous, introducing new Kafka concepts and patterns.

**Technology Stack:**
- **Event Broker**: Apache Kafka
- **Producer**: todo-nodejs-service (existing)
- **Consumer**: event-processor-java-service (Spring Boot + Kafka Streams)
- **Infrastructure**: Docker Compose for local development

---

## Phase 1: Event Sourcing Pattern

### Objective
Store all todo state changes as immutable events in Kafka. The PostgreSQL database becomes a materialized view (projection) that can be rebuilt from the event stream.

### Core Concepts
- Event modeling and event types
- Event store as source of truth
- Database projections
- Event replay and snapshots
- Command Query Responsibility Segregation (CQRS)

### Architecture

```
User Request → todo-nodejs-service → Kafka Topic (todo-events)
                      ↓                         ↓
                 PostgreSQL ← Event Processor (Consumer)
                 (Projection)
```

### Event Types to Implement

1. **TodoCreated**
   - Fields: `todoId`, `title`, `description`, `userId`, `createdAt`

2. **TodoUpdated**
   - Fields: `todoId`, `title`, `description`, `updatedAt`

3. **TodoCompleted**
   - Fields: `todoId`, `completedAt`

4. **TodoDeleted**
   - Fields: `todoId`, `deletedAt`

5. **TodoAssigned**
   - Fields: `todoId`, `assignedTo`, `assignedAt`

6. **TodoPrioritized**
   - Fields: `todoId`, `priority`, `prioritizedAt`

### Implementation Steps

1. **Setup Kafka Infrastructure**
   - Add Kafka and Zookeeper to `docker-compose.yml`
   - Configure topics: `todo-events`, `todo-events-dlq` (dead letter queue)
   - Set up topic partitioning strategy (by `userId` for ordering)

2. **Modify todo-nodejs-service (Producer)**
   - Install KafkaJS library
   - Create event publisher service
   - Wrap database operations in event publication
   - Implement dual-write pattern (DB + Kafka) with transaction handling
   - Add event envelope with metadata (eventId, timestamp, version, correlationId)

3. **Create event-processor-java-service (Consumer)**
   - Generate Spring Boot project with Kafka dependencies
   - Implement Kafka consumer for `todo-events` topic
   - Create event handlers for each event type
   - Update PostgreSQL projections based on events
   - Handle idempotency (same event processed multiple times)

4. **Implement Event Replay Capability**
   - Create admin endpoint to rebuild database from events
   - Implement snapshot strategy (periodic state snapshots to reduce replay time)
   - Add event versioning for schema evolution

### Key Files to Create

- `todo-nodejs-service/src/services/kafka-producer.service.ts`
- `todo-nodejs-service/src/events/todo-events.ts`
- `todo-nodejs-service/src/config/kafka.config.ts`
- `event-processor-java-service/src/main/java/com/polystack/events/TodoEventConsumer.java`
- `event-processor-java-service/src/main/java/com/polystack/projections/TodoProjectionService.java`

### Testing Strategy

- Publish events manually and verify projections
- Test event replay by deleting database and replaying events
- Verify ordering guarantees within same partition
- Test idempotency by replaying same events

### Learning Outcomes

- Event modeling and domain events
- Producer/consumer patterns
- Event sourcing vs traditional CRUD
- Eventual consistency
- Kafka topic partitioning and ordering guarantees

---

## Phase 2: Real-time Collaboration & Activity Feed

### Objective
Enable real-time updates across multiple clients when todos change. Implement fan-out pattern where single event triggers multiple consumer actions.

### Core Concepts
- Consumer groups
- Multiple independent consumers
- Topic subscriptions
- WebSocket integration
- Real-time streaming

### Architecture

```
User A creates todo → todo-nodejs-service → Kafka (todo-events)
                                                    ↓
                        ┌──────────────────────────────────────┐
                        ↓                          ↓           ↓
            WebSocket Service          Notification Service  Event Processor
          (Consumer Group: ws)      (Consumer Group: notif) (Consumer Group: proj)
                        ↓                          ↓
               Push to User B clients    Send email/push notification
```

### Services to Create

1. **websocket-nodejs-service** (New)
   - WebSocket server (Socket.io or ws)
   - Kafka consumer for real-time events
   - Maintains connected client sessions
   - Pushes events to relevant users

2. **notification-java-service** (New)
   - Spring Boot service
   - Kafka consumer for notification events
   - Email/SMS/push notification logic
   - User notification preferences

### Implementation Steps

1. **Create websocket-nodejs-service**
   - Setup WebSocket server with authentication
   - Implement Kafka consumer in separate consumer group
   - Map events to connected clients by userId
   - Handle client connections/disconnections
   - Implement room-based broadcasting (per user, per team)

2. **Create notification-java-service**
   - Setup Spring Kafka consumer
   - Implement notification rules engine
   - Add notification templates
   - Integrate email service (SendGrid, SES, or mock)
   - Store notification history

3. **Enhance Event Schema**
   - Add `notificationRequired` flag
   - Include affected users in event metadata
   - Add event categories for filtering

4. **Frontend Integration**
   - Create WebSocket client in web app
   - Connect to websocket-nodejs-service
   - Listen for real-time updates
   - Update UI reactively

### Key Files to Create

- `apps/services/websocket-nodejs-service/src/server.ts`
- `apps/services/websocket-nodejs-service/src/services/websocket-handler.ts`
- `apps/services/websocket-nodejs-service/src/consumers/activity-consumer.ts`
- `apps/services/notification-java-service/src/main/java/com/polystack/NotificationConsumer.java`
- `apps/services/notification-java-service/src/main/java/com/polystack/NotificationService.java`

### Consumer Group Configuration

```yaml
websocket-service:
  group.id: websocket-consumer-group
  enable.auto.commit: true

notification-service:
  group.id: notification-consumer-group
  enable.auto.commit: false

event-processor:
  group.id: projection-consumer-group
  enable.auto.commit: false
```

### Testing Strategy

- Multiple browser windows with different users
- Verify real-time updates across clients
- Test consumer group independence
- Simulate consumer failures and recovery
- Load test with many concurrent WebSocket connections

### Learning Outcomes

- Consumer groups and offset management
- Fan-out messaging pattern
- Independent scaling of consumers
- WebSocket + Kafka integration
- Real-time streaming architectures

---

## Phase 3: Analytics & Reporting Service

### Objective
Build separate analytics service that processes todo events to generate business metrics and productivity insights. Learn stream processing and aggregations.

### Core Concepts
- Stream processing
- Kafka Streams API
- Windowing and aggregations
- Materialized views
- Time-based processing

### Architecture

```
Kafka (todo-events) → Analytics Service (Kafka Streams)
                              ↓
                      ┌──────────────────┐
                      ↓                  ↓
              State Store          Analytics DB
           (RocksDB/In-memory)      (TimescaleDB)
                      ↓
                Analytics API ← Dashboard Web App
```

### Metrics to Track

1. **Completion Metrics**
   - Todos completed per day/week/month
   - Average completion time
   - Completion rate by user
   - Completion rate by priority

2. **Productivity Trends**
   - Active users per time window
   - Peak creation hours
   - Average todos per user
   - Assignment patterns

3. **Health Metrics**
   - Overdue todo count
   - Aging todos (not updated in X days)
   - Unassigned todos
   - High priority backlog

### Implementation Steps

1. **Create analytics-java-service**
   - Setup Spring Boot with Kafka Streams
   - Configure Kafka Streams topology
   - Implement stream processors for each metric type
   - Setup windowing operations (tumbling, hopping, sliding)

2. **Implement Stream Processing**
   - **Completion Rate Stream**
     - Count completed vs total todos
     - Group by time windows (1 hour, 1 day)
     - Calculate percentages

   - **Average Completion Time Stream**
     - Join TodoCreated with TodoCompleted events
     - Calculate time delta
     - Aggregate averages per time window

   - **User Productivity Stream**
     - Group events by userId
     - Count events per user per window
     - Rank users by activity

3. **Setup Time-Series Database**
   - Use TimescaleDB (PostgreSQL extension) for analytics
   - Store aggregated metrics
   - Create retention policies
   - Index for fast time-range queries

4. **Create Analytics API**
   - REST endpoints for metrics retrieval
   - Query Kafka Streams state stores
   - Query TimescaleDB for historical data
   - Support time-range filtering

5. **Build Analytics Dashboard**
   - Simple web dashboard (React/Vue)
   - Charts for key metrics
   - Real-time updates via SSE or WebSocket
   - Export capabilities (CSV, PDF)

### Key Files to Create

- `apps/services/analytics-java-service/src/main/java/com/polystack/streams/CompletionRateStream.java`
- `apps/services/analytics-java-service/src/main/java/com/polystack/streams/ProductivityStream.java`
- `apps/services/analytics-java-service/src/main/java/com/polystack/controllers/AnalyticsController.java`
- `apps/services/analytics-java-service/src/main/resources/application.yml`

### Kafka Streams Topology Example

```java
StreamsBuilder builder = new StreamsBuilder();

KStream<String, TodoEvent> events = builder.stream("todo-events");

// Completed todos per hour
events
  .filter((key, event) -> event.getType().equals("TodoCompleted"))
  .groupByKey()
  .windowedBy(TimeWindows.ofSizeWithNoGrace(Duration.ofHours(1)))
  .count(Materialized.as("completed-per-hour-store"))
  .toStream()
  .to("analytics-completed-hourly");
```

### Testing Strategy

- Generate synthetic events for different time windows
- Verify aggregation accuracy
- Test windowing behavior (tumbling vs hopping)
- Load test with high event volume
- Test state store recovery after restart

### Learning Outcomes

- Kafka Streams API and DSL
- Stream processing vs batch processing
- Windowing operations
- Stateful stream processing
- Interactive queries on state stores
- Time-series data modeling

---

## Phase 4: Delayed Task Reminder System

### Objective
Implement scheduled event processing for todo reminders based on due dates. Learn about time-based message scheduling and consumer patterns.

### Core Concepts
- Scheduled message processing
- Consumer polling patterns
- Dead letter queues
- Retry strategies
- Time-based triggers

### Architecture

```
User creates todo with due date → todo-nodejs-service
                                        ↓
                              Kafka (todo-events)
                                        ↓
                            Reminder Scheduler Service
                                        ↓
                              Check due dates periodically
                                        ↓
                              Kafka (reminder-events)
                                        ↓
                            Notification Service
                              (sends reminders)
```

### Implementation Steps

1. **Create reminder-scheduler-java-service**
   - Spring Boot service with scheduled tasks
   - Kafka consumer for TodoCreated events with due dates
   - Store reminders in database or in-memory cache
   - Scheduled job to check due dates (every 5 minutes)
   - Publish reminder events to `reminder-events` topic

2. **Implement Reminder Logic**
   - Extract todos with due dates from events
   - Calculate reminder times (e.g., 1 day before, 1 hour before)
   - Store in reminder queue/database
   - Periodic scan for due reminders
   - Publish `ReminderDue` event

3. **Enhance Notification Service**
   - Subscribe to `reminder-events` topic
   - Send reminder notifications (email, push)
   - Track reminder delivery status
   - Handle delivery failures

4. **Implement Dead Letter Queue (DLQ)**
   - Configure DLQ for failed reminder events
   - Retry logic with exponential backoff
   - Manual intervention queue for persistent failures
   - Monitoring and alerting

5. **Add Snooze Functionality**
   - Allow users to snooze reminders
   - Publish `ReminderSnoozed` event
   - Update reminder scheduler

### Event Types

1. **TodoScheduled**
   - Fields: `todoId`, `dueDate`, `reminderTimes[]`

2. **ReminderDue**
   - Fields: `todoId`, `reminderType`, `dueDate`

3. **ReminderSent**
   - Fields: `todoId`, `sentAt`, `channel`

4. **ReminderSnoozed**
   - Fields: `todoId`, `snoozeUntil`

### Key Files to Create

- `apps/services/reminder-scheduler-java-service/src/main/java/com/polystack/ReminderScheduler.java`
- `apps/services/reminder-scheduler-java-service/src/main/java/com/polystack/ReminderRepository.java`
- `apps/services/reminder-scheduler-java-service/src/main/java/com/polystack/consumers/TodoScheduleConsumer.java`

### Scheduling Strategy Options

**Option 1: Database Polling**
- Store reminders in database with due timestamp
- Scheduled job queries for due reminders
- Simple but not scalable

**Option 2: In-Memory Priority Queue**
- Use Java `PriorityQueue` or Quartz Scheduler
- Fast but state lost on restart
- Need persistence for durability

**Option 3: Kafka Streams + State Store**
- Use Kafka Streams to process scheduled events
- Store in RocksDB state store
- Punctuator for periodic checks
- Scalable and fault-tolerant

### Testing Strategy

- Create todos with various due dates
- Verify reminders triggered at correct times
- Test DLQ behavior with simulated failures
- Test retry logic and backoff
- Verify reminder idempotency (no duplicate reminders)

### Learning Outcomes

- Time-based event processing
- Scheduled message patterns in event-driven systems
- Dead letter queues and error handling
- Retry strategies and circuit breakers
- Consumer reliability patterns

---

## Phase 5: Multi-Tenant Todo Sync

### Objective
Synchronize todo state across multiple client applications (web, mobile, desktop) for same user. Learn about partitioning strategies, consumer offsets, and exactly-once semantics.

### Core Concepts
- Topic partitioning by user ID
- Consumer offsets and commit strategies
- Exactly-once semantics (EOS)
- Client-specific event filtering
- Eventual consistency across clients

### Architecture

```
User actions from multiple devices → todo-nodejs-service
                                            ↓
                            Kafka (todo-events partitioned by userId)
                                            ↓
                    ┌───────────────────────┴───────────────────┐
                    ↓                       ↓                   ↓
            Web App Sync          Mobile App Sync      Desktop App Sync
            (React client)        (Flutter/RN)         (Electron)
                    ↓                       ↓                   ↓
              WebSocket ← sync-coordinator-service → Push Notifications
```

### Services to Create

1. **sync-coordinator-java-service**
   - Kafka consumer with user-based partitioning
   - Tracks device registrations per user
   - Publishes device-specific sync events
   - Handles conflict resolution

2. **Device Sync Clients**
   - Web: WebSocket client
   - Mobile: Push notifications + background sync
   - Desktop: WebSocket client

### Implementation Steps

1. **Configure User-Based Partitioning**
   - Use `userId` as partition key for todo-events
   - Ensures all events for a user go to same partition
   - Maintains ordering guarantees per user

2. **Implement sync-coordinator-service**
   - Consume from `todo-events` topic
   - Track device registrations (Redis or in-memory)
   - Filter events per device
   - Handle online/offline device states

3. **Device Registration Flow**
   - Device sends registration request with userId + deviceId
   - Store in device registry
   - Subscribe device to user's event stream

4. **Implement Exactly-Once Semantics**
   - Enable EOS in Kafka producer (`enable.idempotence=true`)
   - Use transactional producer for atomic writes
   - Configure consumer with `isolation.level=read_committed`
   - Implement idempotent event handlers

5. **Offline Sync Strategy**
   - Store consumer offsets per device
   - When device comes online, resume from last offset
   - Send missed events to device
   - Handle conflict resolution (last-write-wins, vector clocks, CRDT)

6. **Conflict Resolution**
   - Detect concurrent updates from different devices
   - Implement resolution strategy:
     - Last-write-wins (timestamp-based)
     - Custom merge logic
     - User prompt for manual resolution

### Partitioning Configuration

```java
// Producer: Partition by userId
ProducerRecord<String, TodoEvent> record =
  new ProducerRecord<>("todo-events", event.getUserId(), event);

// Consumer: Assign specific partitions per consumer instance
// Kafka handles this automatically with consumer groups
```

### Consumer Offset Management

**Manual Offset Commit** (for exactly-once guarantees):
```java
@KafkaListener(topics = "todo-events")
public void consume(ConsumerRecord<String, TodoEvent> record,
                    Acknowledgment ack) {
  processEvent(record.value());
  ack.acknowledge(); // Commit offset only after successful processing
}
```

### Key Files to Create

- `apps/services/sync-coordinator-java-service/src/main/java/com/polystack/SyncCoordinator.java`
- `apps/services/sync-coordinator-java-service/src/main/java/com/polystack/DeviceRegistry.java`
- `apps/services/sync-coordinator-java-service/src/main/java/com/polystack/ConflictResolver.java`
- `apps/web/todo-web/src/services/sync-client.ts`

### Client Implementation Example

```typescript
// Web client
class TodoSyncClient {
  private ws: WebSocket;
  private lastSyncOffset: number;

  connect(userId: string, deviceId: string) {
    this.ws = new WebSocket(`ws://sync-service/sync`);
    this.ws.send({ userId, deviceId, lastOffset: this.lastSyncOffset });
  }

  onEvent(event: TodoEvent) {
    // Apply event to local state
    this.updateLocalTodo(event);
    this.lastSyncOffset = event.offset;
    this.saveOffset(); // Persist to localStorage
  }
}
```

### Testing Strategy

- Multiple browser tabs + mobile simulator
- Verify sync across all devices
- Test offline mode and resume sync
- Simulate network partitions
- Test conflict resolution scenarios
- Verify exactly-once delivery

### Learning Outcomes

- Partitioning strategies and partition keys
- Consumer group coordination
- Offset management and commit strategies
- Exactly-once semantics in Kafka
- Distributed state synchronization
- Conflict resolution in distributed systems
- Client-side event sourcing

---

## Infrastructure Setup

### Docker Compose Configuration

```yaml
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000
    ports:
      - "2181:2181"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
      - "29092:29092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092,PLAINTEXT_HOST://localhost:29092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    depends_on:
      - kafka
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092

  postgres:
    # existing postgres config

  timescaledb:
    image: timescale/timescaledb:latest-pg14
    ports:
      - "5433:5432"
    environment:
      POSTGRES_USER: analytics
      POSTGRES_PASSWORD: analytics
      POSTGRES_DB: todo_analytics
```

### Topic Creation Script

```bash
#!/bin/bash
# scripts/create-topics.sh

kafka-topics --create \
  --bootstrap-server localhost:29092 \
  --topic todo-events \
  --partitions 6 \
  --replication-factor 1 \
  --config retention.ms=604800000 # 7 days

kafka-topics --create \
  --bootstrap-server localhost:29092 \
  --topic reminder-events \
  --partitions 3 \
  --replication-factor 1

kafka-topics --create \
  --bootstrap-server localhost:29092 \
  --topic analytics-completed-hourly \
  --partitions 1 \
  --replication-factor 1 \
  --config cleanup.policy=compact
```

---

## Service Dependencies Matrix

| Service | Language | Framework | Kafka Role | Consumer Group | Topics Consumed | Topics Produced |
|---------|----------|-----------|------------|----------------|-----------------|-----------------|
| todo-nodejs-service | Node.js | Fastify | Producer | - | - | todo-events |
| event-processor-java-service | Java | Spring Boot | Consumer | projection-group | todo-events | - |
| websocket-nodejs-service | Node.js | Socket.io | Consumer | websocket-group | todo-events | - |
| notification-java-service | Java | Spring Boot | Consumer | notification-group | todo-events, reminder-events | - |
| analytics-java-service | Java | Spring Boot (Kafka Streams) | Stream Processor | analytics-group | todo-events | analytics-* |
| reminder-scheduler-java-service | Java | Spring Boot | Consumer + Producer | reminder-group | todo-events | reminder-events |
| sync-coordinator-java-service | Java | Spring Boot | Consumer | sync-group | todo-events | device-sync-events |

---

## Progressive Implementation Timeline

### Phase 1: Weeks 1-2
- Kafka infrastructure setup
- Event sourcing implementation
- Basic producer/consumer

### Phase 2: Week 3
- WebSocket service
- Real-time collaboration
- Multiple consumer groups

### Phase 3: Week 4
- Analytics service
- Kafka Streams
- Stream processing

### Phase 4: Week 5
- Reminder scheduler
- Dead letter queues
- Retry logic

### Phase 5: Week 6
- Multi-device sync
- Exactly-once semantics
- Conflict resolution

---

## Success Criteria

### Phase 1
- [ ] All todo operations publish events
- [ ] Database can be rebuilt from events
- [ ] Event replay works correctly
- [ ] Idempotent event handling

### Phase 2
- [ ] Real-time updates across browser tabs
- [ ] Notifications sent on todo changes
- [ ] Consumer groups working independently
- [ ] WebSocket connections stable

### Phase 3
- [ ] Analytics dashboard shows metrics
- [ ] Kafka Streams processing working
- [ ] Windowing operations correct
- [ ] State stores queryable

### Phase 4
- [ ] Reminders sent at correct times
- [ ] DLQ captures failed events
- [ ] Retry logic working
- [ ] No duplicate reminders

### Phase 5
- [ ] Todos sync across devices
- [ ] Offline sync works
- [ ] Exactly-once delivery verified
- [ ] Conflicts resolved correctly

---

## Monitoring & Observability

### Kafka Metrics to Track
- Consumer lag per consumer group
- Message throughput (messages/sec)
- Partition distribution
- Failed message count (DLQ)
- Consumer rebalances

### Tools
- Kafka UI (web interface)
- Prometheus + Grafana
- Spring Boot Actuator
- Custom health endpoints

---

## Learning Resources

- **Kafka Documentation**: https://kafka.apache.org/documentation/
- **Kafka Streams**: https://kafka.apache.org/documentation/streams/
- **Spring Kafka**: https://spring.io/projects/spring-kafka
- **Event Sourcing**: Martin Fowler's articles
- **Designing Event-Driven Systems**: Book by Ben Stopford

---

## Next Steps

1. Start with Phase 1 - Event Sourcing
2. Setup Kafka infrastructure in Docker Compose
3. Modify todo-nodejs-service to publish events
4. Create event-processor-java-service
5. Implement event replay
6. Move to Phase 2 after Phase 1 is stable

Good luck with your Kafka learning journey!
