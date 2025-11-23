# Kafka Todo App - Implementation Plan

## Context
Building event-driven todo application for learning Kafka. User is senior full-stack engineer (Angular/Node.js/Java) preparing for senior backend interviews at banks. Goal: demonstrate Java/Spring Boot + Kafka expertise.

## Architecture
- **Node.js REST API**: HTTP endpoints, publishes events to Kafka
- **Java/Spring Boot Microservices**: Event consumers, business logic
- **Kafka**: Event streaming backbone
- **PostgreSQL**: Primary database (event-sourced)
- **MongoDB/PostgreSQL**: Analytics database

## Tech Stack
- Node.js + Express + kafkajs
- Java 17+ + Spring Boot 3.x + Spring Kafka
- Apache Kafka + Zookeeper (or KRaft mode)
- Docker + Docker Compose for local development
- PostgreSQL, optional MongoDB

## Event Schema
All events published to Kafka with structure:
```json
{
  "eventId": "uuid",
  "eventType": "TODO_CREATED|TODO_UPDATED|TODO_COMPLETED|TODO_DELETED|TODO_ASSIGNED",
  "timestamp": "ISO8601",
  "userId": "string",
  "todoId": "string",
  "data": {}, // event-specific payload
  "metadata": {}
}
```

## Kafka Topics
- `todo-events`: Main event stream (all todo operations)
- `todo-notifications`: Notification events
- `todo-analytics`: Analytics-specific events (can be same as todo-events)

## Services to Implement

### 1. Node.js REST API Service
- Express server with todo CRUD endpoints
- Kafka producer publishing events
- Immediate HTTP responses
- Routes: POST /todos, PUT /todos/:id, DELETE /todos/:id, PATCH /todos/:id/complete

### 2. Java Event Processor Service (Spring Boot)
- Consumes `todo-events` topic
- Updates PostgreSQL (event sourcing pattern)
- Maintains current state projection
- @KafkaListener implementation

### 3. Java Analytics Service (Spring Boot)
- Kafka Streams application
- Real-time aggregations: todos per day, completion rate, avg time to complete
- Stores metrics in separate database
- REST endpoints to query analytics

### 4. Java Notification Service (Spring Boot)
- Consumes `todo-events` for reminders
- Scheduled checks for due dates
- Email/console logging for notifications
- DLQ (Dead Letter Queue) for failed notifications

### 5. WebSocket Gateway Service (Node.js or Java)
- Consumes `todo-events`
- Pushes real-time updates to connected frontend clients
- WebSocket server for multi-user collaboration

## Implementation Phases (Priority Order)

### Phase 1: Event Sourcing Foundation
- Setup Kafka + Docker Compose
- Node.js API with Kafka producer
- Java Event Processor consuming and writing to PostgreSQL
- Basic todo CRUD with event publishing

### Phase 2: Real-time Collaboration
- WebSocket Gateway Service
- Frontend WebSocket connection
- Live updates across clients

### Phase 3: Analytics & Reporting
- Java Analytics Service with Kafka Streams
- Aggregations and metrics calculation
- Analytics dashboard endpoints

### Phase 4: Delayed Task Reminders
- Java Notification Service
- Due date checking logic
- Reminder notifications

### Phase 5: Multi-Tenant Sync
- Partitioning by userId
- Consumer offset management
- Multiple client support (web/mobile)

## Database Schema

### PostgreSQL (Event Store + Projection)
```sql
-- Event store
events (
  event_id UUID PRIMARY KEY,
  event_type VARCHAR,
  aggregate_id UUID, -- todo_id
  user_id UUID,
  timestamp TIMESTAMP,
  data JSONB,
  version INTEGER
)

-- Current state projection
todos (
  id UUID PRIMARY KEY,
  user_id UUID,
  title VARCHAR,
  description TEXT,
  completed BOOLEAN,
  due_date TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Key Learning Objectives
- Event sourcing pattern
- Kafka producers/consumers in Node.js and Java
- Spring Kafka annotations and configuration
- Kafka Streams for real-time processing
- Consumer groups and partitioning strategies
- Event-driven microservices architecture
- Polyglot microservices communication

## Deployment
- Docker Compose for local development (Kafka, Zookeeper, PostgreSQL, all services)
- Each service in separate container
- Environment variables for configuration

## Notes for Implementation
- Use Spring Boot Kafka auto-configuration
- Implement idempotency (handle duplicate events)
- Add correlation IDs for distributed tracing
- Configure appropriate Kafka retention policies
- Use consumer groups for scalability
- Implement health checks for all services
- Add basic error handling and retry logic
