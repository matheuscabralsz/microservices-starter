# Logging System Architecture Plan

**Status**: Planning
**Created**: 2025-11-16
**Updated**: 2025-11-16 (Changed to general-purpose logging system)
**Purpose**: Build a production-grade centralized logging system for learning event-driven architecture

## 🎯 System Overview

**Goal**: Create a **single, centralized logging service** that collects, processes, and stores **all types of logs** from **all microservices** in the platform.

**Key Features:**
- ✅ Single Kafka topic (`logs`) for all services
- ✅ Multiple log types (API, error, business, security, performance)
- ✅ Intelligent routing to different Elasticsearch indexes
- ✅ Language-agnostic (works with Node.js, Go, Python, Java, etc.)
- ✅ KRaft-mode Kafka (no Zookeeper dependency)
- ✅ Central Java service for log processing
- ✅ Kibana dashboards for visualization

**Service Name**: `log-java-service` (not `log-consumer-java-service`)
**Why?** This is THE logging service for the entire platform, not just one consumer among many.

---

## Overview

Implement a **centralized Kafka + ELK Stack** logging system that captures **all types of logs** from **all services** in the microservices platform and stores them in Elasticsearch for search, analysis, and visualization.

**Log Types Supported:**
- 📊 **API Request Logs** - HTTP requests/responses
- ❌ **Application Errors** - Exceptions, stack traces
- 💼 **Business Events** - User actions, transactions
- 🔍 **Debugging Logs** - Development diagnostics
- 🔐 **Security Events** - Authentication, authorization
- 📈 **Performance Metrics** - Response times, resource usage

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│              All Microservices                           │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Todo Service │  │ Auth Service │  │Payment Service│  │
│  │  (Node.js)   │  │  (Node.js)   │  │   (Go)        │  │
│  │              │  │              │  │               │  │
│  │ Logger ─────►│  │ Logger ─────►│  │ Logger ──────►│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                 │                  │          │
└─────────┼─────────────────┼──────────────────┼──────────┘
          │                 │                  │
          │   All services publish logs        │
          │                 │                  │
          └────────┬────────┴──────────────────┘
                   │ Publish (async)
                   ▼
          ┌─────────────────┐
          │  Kafka Topic     │
          │    "logs"        │
          │                  │
          │  Partitions: 3   │
          └────────┬─────────┘
                   │ Consume
                   ▼
          ┌─────────────────────┐
          │ log-java-service    │  ← Central logging service
          │  (Spring Boot)      │
          │                     │
          │ - Consumes all logs │
          │ - Parses log types  │
          │ - Routes to indexes │
          └────────┬────────────┘
                   │ Index by type
                   ▼
          ┌─────────────────────┐      ┌─────────────────┐
          │  Elasticsearch      │◄────►│  Kibana         │
          │                     │      │  (Visualization)│
          │  Indexes:           │      │                 │
          │  - logs-api         │      │  - Dashboards   │
          │  - logs-error       │      │  - Alerts       │
          │  - logs-business    │      │  - Search       │
          │  - logs-security    │      │                 │
          └─────────────────────┘      └─────────────────┘
```

---

## Components

### 1. Infrastructure (Docker Compose)

**Location**: `tools/local-dev/docker-compose.yml`

#### Services to Add:

**Kafka (KRaft Mode - No Zookeeper Needed!)**
```yaml
kafka:
  image: apache/kafka:latest
  container_name: polystack-kafka
  ports:
    - "9092:9092"
    - "9093:9093"
  environment:
    # KRaft mode configuration
    KAFKA_NODE_ID: 1
    KAFKA_PROCESS_ROLES: broker,controller
    KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
    KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
    KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
    KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
    KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
    KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
    KAFKA_NUM_PARTITIONS: 3
    # Auto-create topics
    KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
    # Cluster ID (required for KRaft)
    CLUSTER_ID: 'MkU3OEVBNTcwNTJENDM2Qk'
  volumes:
    - kafka_data:/var/lib/kafka/data
  healthcheck:
    test: ["CMD-SHELL", "kafka-broker-api-versions --bootstrap-server localhost:9092"]
    interval: 10s
    timeout: 5s
    retries: 5
```

> **Why KRaft?**
> - ✅ No Zookeeper dependency (simpler setup)
> - ✅ Faster metadata operations
> - ✅ Modern Kafka architecture (Kafka 3.0+)
> - ✅ One less service to manage
> - ✅ Industry future (Zookeeper deprecated in Kafka 4.0)

**Elasticsearch**
```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
  ports:
    - "9200:9200"
  environment:
    - discovery.type=single-node
    - xpack.security.enabled=false
```

**Kibana**
```yaml
kibana:
  image: docker.elastic.co/kibana/kibana:8.11.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch
```

---

### 2. Kafka Logger Library (Shared)

**Location**: `libs/shared/src/lib/logger/`

Create a **reusable logging library** that all services can use to publish logs to Kafka.

#### For Node.js Services:

#### Dependencies to Add:
```json
{
  "dependencies": {
    "kafkajs": "^2.2.4"
  }
}
```

#### File Structure:
```
src/
├── config/
│   └── kafka.ts              # Kafka producer configuration
├── middlewares/
│   └── logging.middleware.ts # Request/response logging middleware
└── types/
    └── log.types.ts          # Log message type definitions
```

#### Universal Log Message Schema:
```typescript
interface LogMessage {
  // Core fields (required)
  timestamp: string;          // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: string;            // Service name (e.g., 'todo-nodejs-service')
  logType: 'api' | 'error' | 'business' | 'security' | 'performance' | 'debug';
  message: string;            // Human-readable log message

  // Optional metadata (varies by log type)
  metadata?: {
    // API Request logs
    requestId?: string;
    method?: string;          // GET, POST, PUT, etc.
    path?: string;            // /api/v1/todos
    statusCode?: number;      // 200, 404, 500, etc.
    responseTime?: number;    // Milliseconds
    userAgent?: string;
    ip?: string;

    // Error logs
    errorType?: string;       // TypeError, ValidationError, etc.
    errorStack?: string;      // Stack trace
    errorCode?: string;       // Custom error code

    // Business event logs
    userId?: string;
    transactionId?: string;
    action?: string;          // 'user.login', 'payment.processed'
    amount?: number;

    // Security logs
    authMethod?: string;
    permissions?: string[];
    accessDenied?: boolean;

    // Performance logs
    cpuUsage?: number;
    memoryUsage?: number;
    dbQueryTime?: number;

    // Any additional context
    [key: string]: any;
  };

  // Environment info
  environment?: 'development' | 'staging' | 'production';
  hostname?: string;
  version?: string;           // Service version
}
```

#### Example Log Messages:

**1. API Request Log:**
```json
{
  "timestamp": "2025-11-16T10:30:00.000Z",
  "level": "info",
  "service": "todo-nodejs-service",
  "logType": "api",
  "message": "GET /api/v1/todos completed",
  "metadata": {
    "requestId": "req-123",
    "method": "GET",
    "path": "/api/v1/todos",
    "statusCode": 200,
    "responseTime": 45,
    "ip": "192.168.1.100"
  }
}
```

**2. Application Error Log:**
```json
{
  "timestamp": "2025-11-16T10:35:00.000Z",
  "level": "error",
  "service": "payment-golang-service",
  "logType": "error",
  "message": "Failed to process payment",
  "metadata": {
    "errorType": "PaymentError",
    "errorCode": "INSUFFICIENT_FUNDS",
    "errorStack": "PaymentError: Insufficient funds\n  at processPayment...",
    "transactionId": "txn-456",
    "userId": "user-789"
  }
}
```

**3. Business Event Log:**
```json
{
  "timestamp": "2025-11-16T10:40:00.000Z",
  "level": "info",
  "service": "auth-nodejs-service",
  "logType": "business",
  "message": "User logged in successfully",
  "metadata": {
    "userId": "user-789",
    "action": "user.login",
    "ip": "192.168.1.100",
    "authMethod": "email-password"
  }
}
```

**4. Security Event Log:**
```json
{
  "timestamp": "2025-11-16T10:45:00.000Z",
  "level": "warn",
  "service": "api-gateway",
  "logType": "security",
  "message": "Access denied: insufficient permissions",
  "metadata": {
    "userId": "user-123",
    "accessDenied": true,
    "requiredPermissions": ["admin:write"],
    "userPermissions": ["user:read"],
    "path": "/api/admin/users"
  }
}
```

#### Implementation:
- Create Kafka producer singleton
- Register Fastify hook (`onResponse`) to capture all requests
- Async publish to Kafka (fire-and-forget)
- Handle Kafka connection errors gracefully
- Add request correlation ID

---

### 3. Central Logging Service (Java/Spring Boot)

**Location**: `apps/services/log-java-service/`

This service consumes **all logs from all services** and intelligently routes them to different Elasticsearch indexes based on log type.

#### Tech Stack:
- **Java 17+**
- **Spring Boot 3.x**
- **Spring Kafka** (Kafka consumer)
- **Spring Data Elasticsearch** (ES client)
- **Jackson** (JSON parsing)
- **Lombok** (reduce boilerplate)

#### Project Structure:
```
log-java-service/
├── src/
│   └── main/
│       ├── java/
│       │   └── com/polystack/logservice/
│       │       ├── LogServiceApplication.java
│       │       ├── config/
│       │       │   ├── KafkaConsumerConfig.java
│       │       │   └── ElasticsearchConfig.java
│       │       ├── model/
│       │       │   ├── LogMessage.java        # Base log entity
│       │       │   ├── ApiLog.java            # API-specific log
│       │       │   ├── ErrorLog.java          # Error log
│       │       │   └── BusinessLog.java       # Business event log
│       │       ├── consumer/
│       │       │   └── LogConsumer.java       # Main Kafka consumer
│       │       ├── repository/
│       │       │   ├── ApiLogRepository.java      # API logs ES repo
│       │       │   ├── ErrorLogRepository.java    # Error logs ES repo
│       │       │   └── BusinessLogRepository.java # Business logs ES repo
│       │       └── service/
│       │           ├── LogService.java        # Main processing logic
│       │           └── LogRouter.java         # Routes to correct index
│       └── resources/
│           └── application.yml
├── pom.xml                                  # Maven dependencies
└── Dockerfile
```

#### Maven Dependencies (pom.xml):
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.kafka</groupId>
        <artifactId>spring-kafka</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
    </dependency>
</dependencies>
```

#### Configuration (application.yml):
```yaml
spring:
  kafka:
    bootstrap-servers: kafka:29092
    consumer:
      group-id: log-service-group
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer

  elasticsearch:
    uris: http://elasticsearch:9200

app:
  kafka:
    topic: logs  # Single topic for all logs
  elasticsearch:
    indexes:
      api: logs-api
      error: logs-error
      business: logs-business
      security: logs-security
      performance: logs-performance
      debug: logs-debug
```

#### Key Classes:

**ApiLog.java** (Elasticsearch Document)
```java
@Document(indexName = "api-logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiLog {
    @Id
    private String id;

    @Field(type = FieldType.Date)
    private Instant timestamp;

    @Field(type = FieldType.Keyword)
    private String requestId;

    @Field(type = FieldType.Keyword)
    private String method;

    @Field(type = FieldType.Text)
    private String path;

    @Field(type = FieldType.Integer)
    private Integer statusCode;

    @Field(type = FieldType.Long)
    private Long responseTime;

    @Field(type = FieldType.Text)
    private String userAgent;

    @Field(type = FieldType.Ip)
    private String ip;

    @Field(type = FieldType.Keyword)
    private String userId;

    @Field(type = FieldType.Text)
    private String errorMessage;
}
```

**LogConsumer.java** (Kafka Listener)
```java
@Component
@Slf4j
public class LogConsumer {

    @Autowired
    private LogService logService;

    @KafkaListener(topics = "${app.kafka.topic}", groupId = "${spring.kafka.consumer.group-id}")
    public void consume(@Payload String message) {
        log.debug("Received log message from Kafka");
        try {
            logService.processAndRoute(message);
        } catch (Exception e) {
            log.error("Failed to process log message", e);
            // TODO: Send to DLQ (Dead Letter Queue)
        }
    }
}
```

**LogRouter.java** (Routes logs to correct index)
```java
@Component
@Slf4j
public class LogRouter {

    @Value("${app.elasticsearch.indexes.api}")
    private String apiIndex;

    @Value("${app.elasticsearch.indexes.error}")
    private String errorIndex;

    @Value("${app.elasticsearch.indexes.business}")
    private String businessIndex;

    @Value("${app.elasticsearch.indexes.security}")
    private String securityIndex;

    @Autowired
    private ApiLogRepository apiLogRepository;

    @Autowired
    private ErrorLogRepository errorLogRepository;

    @Autowired
    private BusinessLogRepository businessLogRepository;

    public void route(LogMessage logMessage) {
        switch (logMessage.getLogType()) {
            case "api":
                ApiLog apiLog = convertToApiLog(logMessage);
                apiLogRepository.save(apiLog);
                log.info("Saved API log to index: {}", apiIndex);
                break;

            case "error":
                ErrorLog errorLog = convertToErrorLog(logMessage);
                errorLogRepository.save(errorLog);
                log.info("Saved error log to index: {}", errorIndex);
                break;

            case "business":
                BusinessLog businessLog = convertToBusinessLog(logMessage);
                businessLogRepository.save(businessLog);
                log.info("Saved business log to index: {}", businessIndex);
                break;

            case "security":
                // Save to security index
                log.info("Saved security log to index: {}", securityIndex);
                break;

            default:
                log.warn("Unknown log type: {}, saving to default index", logMessage.getLogType());
                break;
        }
    }

    private ApiLog convertToApiLog(LogMessage msg) {
        // Convert LogMessage to ApiLog entity
        return ApiLog.builder()
            .timestamp(msg.getTimestamp())
            .service(msg.getService())
            .level(msg.getLevel())
            .message(msg.getMessage())
            .requestId(msg.getMetadata().get("requestId"))
            .method(msg.getMetadata().get("method"))
            .path(msg.getMetadata().get("path"))
            .statusCode((Integer) msg.getMetadata().get("statusCode"))
            .responseTime((Long) msg.getMetadata().get("responseTime"))
            .build();
    }

    // Similar methods for ErrorLog, BusinessLog, etc.
}
```

**LogService.java** (Main Processing Logic)
```java
@Service
@Slf4j
public class LogService {

    @Autowired
    private LogRouter logRouter;

    @Autowired
    private ObjectMapper objectMapper;

    public void processAndRoute(String jsonMessage) throws JsonProcessingException {
        // Parse the JSON message
        LogMessage logMessage = objectMapper.readValue(jsonMessage, LogMessage.class);

        log.debug("Processing log from service: {}, type: {}",
            logMessage.getService(), logMessage.getLogType());

        // Validate log message
        if (logMessage.getService() == null || logMessage.getLogType() == null) {
            log.warn("Invalid log message: missing service or logType");
            return;
        }

        // Route to appropriate Elasticsearch index
        logRouter.route(logMessage);
    }
}
```

---

### 4. Elasticsearch Setup

#### Index Mapping
```json
{
  "mappings": {
    "properties": {
      "timestamp": { "type": "date" },
      "requestId": { "type": "keyword" },
      "method": { "type": "keyword" },
      "path": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "statusCode": { "type": "integer" },
      "responseTime": { "type": "long" },
      "userAgent": { "type": "text" },
      "ip": { "type": "ip" },
      "userId": { "type": "keyword" },
      "errorMessage": { "type": "text" }
    }
  }
}
```

#### Kibana Dashboards

**Suggested Visualizations:**
1. **Request Volume Over Time** (Line chart)
2. **Status Code Distribution** (Pie chart)
3. **Average Response Time** (Metric)
4. **Error Rate** (Metric with threshold)
5. **Top Endpoints by Request Count** (Bar chart)
6. **Slowest Endpoints** (Table)
7. **Geographic Distribution** (Map - if geo-IP enabled)

---

## Implementation Steps

### Phase 1: Infrastructure Setup
1. ⬜ Add Kafka (KRaft mode) to docker-compose.yml
2. ⬜ Add Elasticsearch to docker-compose.yml
3. ⬜ Add Kibana to docker-compose.yml
4. ⬜ Add volumes to docker-compose.yml (kafka_data, elasticsearch_data)
5. ⬜ Start all services: `docker-compose up -d kafka elasticsearch kibana`
6. ⬜ Verify Kafka is running: `docker-compose logs kafka`
7. ⬜ Verify Elasticsearch: `curl http://localhost:9200`
8. ⬜ Verify Kibana: open `http://localhost:5601`
9. ⬜ Create Kafka topic `api-logs` (or let auto-create handle it)

### Phase 2: Kafka Logger Integration (Todo Service)
1. ⬜ Install kafkajs in todo-nodejs-service
2. ⬜ Create Kafka producer config
3. ⬜ Create universal logging middleware
4. ⬜ Define LogMessage interface with all log types
5. ⬜ Register middleware in Fastify (API request logging)
6. ⬜ Add application error logging
7. ⬜ Add business event logging (optional)
8. ⬜ Test logging by making API requests
9. ⬜ Verify messages in Kafka topic: `kafka-console-consumer --topic logs`

### Phase 3: Central Logging Service (Java)
1. ⬜ Create new Spring Boot project: `log-java-service`
2. ⬜ Add Maven dependencies (Spring Kafka, Spring Data Elasticsearch, Lombok)
3. ⬜ Implement LogMessage base class
4. ⬜ Implement ApiLog, ErrorLog, BusinessLog entities
5. ⬜ Create repositories for each log type
6. ⬜ Implement LogConsumer (Kafka listener)
7. ⬜ Implement LogService (parsing logic)
8. ⬜ Implement LogRouter (routing to correct index)
9. ⬜ Configure Kafka consumer (application.yml)
10. ⬜ Configure Elasticsearch indexes
11. ⬜ Create Dockerfile
12. ⬜ Add to docker-compose.yml
13. ⬜ Test end-to-end flow with multiple log types

### Phase 4: Kibana Setup
1. ⬜ Create index pattern in Kibana
2. ⬜ Create visualizations
3. ⬜ Create dashboard
4. ⬜ Set up filters and queries
5. ⬜ Document how to use Kibana

### Phase 5: Production Enhancements
1. ⬜ Add Dead Letter Queue (DLQ) for failed messages
2. ⬜ Implement message retry logic
3. ⬜ Add metrics/monitoring (Prometheus)
4. ⬜ Implement log rotation/retention policies
5. ⬜ Add security (API keys, SSL/TLS)
6. ⬜ Performance tuning (batching, compression)

---

## Configuration

### Environment Variables

**All Services (Node.js/Go/Python/etc.):**
```env
KAFKA_BROKERS=localhost:9092
KAFKA_LOG_TOPIC=logs
KAFKA_CLIENT_ID=<service-name>
SERVICE_NAME=<service-name>           # e.g., todo-nodejs-service
ENVIRONMENT=development
```

**Log Service (Java):**
```env
KAFKA_BROKERS=kafka:29092
KAFKA_TOPIC=logs
KAFKA_GROUP_ID=log-service-group
ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTICSEARCH_INDEX_API=logs-api
ELASTICSEARCH_INDEX_ERROR=logs-error
ELASTICSEARCH_INDEX_BUSINESS=logs-business
ELASTICSEARCH_INDEX_SECURITY=logs-security
```

---

## Monitoring & Observability

### Health Checks
- Kafka: Check broker connectivity
- Elasticsearch: Check cluster health
- Consumer: Check consumer lag

### Metrics to Track
- Messages published per second
- Consumer lag (messages behind)
- Elasticsearch indexing rate
- Failed message count
- Average processing time

### Alerts
- Consumer lag > 10,000 messages
- Elasticsearch disk usage > 80%
- Error rate > 5%
- Kafka broker down

---

## Testing Strategy

### Unit Tests
- Kafka producer logic
- Message serialization/deserialization
- Elasticsearch repository methods

### Integration Tests
- End-to-end message flow
- Kafka → Consumer → Elasticsearch
- Error handling and retries

### Load Testing
- Publish 10,000 messages/sec
- Measure consumer throughput
- Measure Elasticsearch indexing rate
- Identify bottlenecks

---

## Learning Outcomes

### Technologies
- ✅ Apache Kafka (producers, consumers, topics, partitions)
- ✅ Elasticsearch (indexing, search, aggregations)
- ✅ Kibana (visualizations, dashboards)
- ✅ Spring Boot (Java microservices)
- ✅ Spring Kafka (Kafka integration)
- ✅ Spring Data Elasticsearch
- ✅ Event-driven architecture

### Concepts
- ✅ Message queues vs event streams
- ✅ Producer/consumer patterns
- ✅ At-least-once delivery semantics
- ✅ Consumer groups and partitions
- ✅ Offset management
- ✅ Dead letter queues
- ✅ Observability patterns
- ✅ Distributed systems debugging

### Best Practices
- ✅ Async logging (non-blocking)
- ✅ Structured logging (JSON)
- ✅ Correlation IDs for tracing
- ✅ Error handling in distributed systems
- ✅ Message schema evolution
- ✅ Idempotent consumers
- ✅ Backpressure handling

---

## Troubleshooting

### Common Issues

**Kafka Connection Refused**
- Check Kafka broker is running: `docker-compose ps`
- Verify advertised listeners configuration
- Check network connectivity

**Consumer Not Receiving Messages**
- Verify topic exists: `kafka-topics --list`
- Check consumer group is active
- Verify offset position

**Elasticsearch Indexing Errors**
- Check mapping conflicts
- Verify index exists
- Check disk space

**High Consumer Lag**
- Scale up consumer instances
- Increase partition count
- Optimize processing logic

---

## Future Enhancements

### Short Term
- Add structured logging library (winston/pino)
- Implement request/response sanitization (PII)
- Add log sampling (don't log every request)

### Medium Term
- Add log aggregation from multiple services
- Implement distributed tracing (OpenTelemetry)
- Add anomaly detection

### Long Term
- Migrate to Kafka Streams for real-time processing
- Add machine learning for pattern detection
- Implement log-based alerts

---

## Resources

### Documentation
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Spring Kafka](https://spring.io/projects/spring-kafka)
- [Elasticsearch Guide](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kibana Guide](https://www.elastic.co/guide/en/kibana/current/index.html)

### Tutorials
- [KafkaJS Getting Started](https://kafka.js.org/docs/getting-started)
- [Spring Boot Kafka Tutorial](https://www.baeldung.com/spring-kafka)
- [Elasticsearch with Spring Data](https://www.baeldung.com/spring-data-elasticsearch-tutorial)

---

## Success Criteria

- ✅ All API requests logged to Kafka
- ✅ Consumer processes messages successfully
- ✅ Logs visible in Elasticsearch
- ✅ Kibana dashboard shows real-time metrics
- ✅ System handles 1000+ requests/min
- ✅ Consumer lag stays under 100 messages
- ✅ No message loss under normal conditions
- ✅ Graceful error handling

---

## Appendix: Kafka KRaft Mode Explained

### What is KRaft?

**KRaft** (Kafka Raft) is Kafka's new consensus protocol that **replaces Apache Zookeeper** for metadata management.

### Traditional Kafka (with Zookeeper)
```
┌──────────────┐
│  Zookeeper   │  ← Stores metadata, coordinates cluster
└──────┬───────┘
       │
   ┌───┴───┬───────┐
   ▼       ▼       ▼
┌──────┐┌──────┐┌──────┐
│Kafka ││Kafka ││Kafka │
│Broker││Broker││Broker│
└──────┘└──────┘└──────┘
```

### Modern Kafka (KRaft Mode)
```
┌─────────────────────────────────┐
│      Kafka Cluster (KRaft)      │
│                                 │
│  ┌──────────┐  ┌──────────┐    │
│  │ Broker   │  │ Broker   │    │
│  │(Controller)│(Follower)│    │
│  └──────────┘  └──────────┘    │
│                                 │
│  Metadata managed internally!   │
└─────────────────────────────────┘
```

### Key Differences

| Feature | Zookeeper Mode | KRaft Mode |
|---------|---------------|------------|
| **External dependency** | Required (Zookeeper) | None |
| **Simplicity** | Complex (2 systems) | Simple (1 system) |
| **Performance** | Slower metadata ops | Faster |
| **Scalability** | Limited by Zookeeper | Better scaling |
| **Future support** | Deprecated in Kafka 4.0 | Standard going forward |

### KRaft Configuration Explained

```yaml
# Node identity
KAFKA_NODE_ID: 1                     # Unique ID for this broker

# Roles - this node acts as both broker and controller
KAFKA_PROCESS_ROLES: broker,controller

# Listener configurations
KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092

# Controller quorum (who participates in consensus)
KAFKA_CONTROLLER_QUORUM_VOTERS: 1@localhost:9093

# Required cluster ID (must be unique, generate with: kafka-storage random-uuid)
CLUSTER_ID: 'MkU3OEVBNTcwNTJENDM2Qk'
```

### Benefits for This Project

1. **Fewer services** - No need to run and monitor Zookeeper
2. **Less complexity** - One system to learn instead of two
3. **Modern approach** - Learn the future of Kafka
4. **Better performance** - Faster metadata operations
5. **Easier debugging** - All logs in one place

---

**Next Steps**: Begin with Phase 1 (Infrastructure Setup)
