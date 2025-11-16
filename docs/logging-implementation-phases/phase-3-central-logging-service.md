# Phase 3: Central Logging Service (Java/Spring Boot) - Detailed Implementation Plan

**Phase**: 3 of 5
**Goal**: Build a Spring Boot service that consumes logs from Kafka and indexes them in Elasticsearch
**Duration**: 4-6 hours
**Prerequisites**: Phase 1 & 2 completed (Kafka running, todo service publishing logs)

---

## Overview

This phase creates `log-java-service`, a Spring Boot application that:
1. Consumes log messages from Kafka topic `logs`
2. Parses and validates log messages
3. Routes logs to different Elasticsearch indexes based on `logType`
4. Provides health check and monitoring endpoints

**Why Java/Spring Boot?**
- Industry-standard for enterprise microservices
- Excellent Kafka integration (Spring Kafka)
- Robust Elasticsearch support (Spring Data Elasticsearch)
- Great for learning event-driven patterns
- Production-ready features (health checks, metrics, error handling)

**Elasticsearch Index Strategy**:
- `logs-api` - API request/response logs
- `logs-error` - Application errors and exceptions
- `logs-business` - Business events
- `logs-security` - Security events
- `logs-performance` - Performance metrics
- `logs-debug` - Debug logs

---

## Prerequisites Check

Before starting, verify:
- [ ] Phase 1 completed (Kafka, Elasticsearch, Kibana running)
- [ ] Phase 2 completed (todo service publishing logs to Kafka)
- [ ] Java 17+ installed: `java -version`
- [ ] Maven 3.6+ installed: `mvn -version`
- [ ] Logs appearing in Kafka topic: `kafka-console-consumer --topic logs`
- [ ] Elasticsearch accessible: `curl http://localhost:9200`

---

## Architecture Overview

```
Kafka Topic (logs)
       ↓
┌──────────────────┐
│ LogConsumer      │  ← Kafka listener (@KafkaListener)
│ (Kafka → JSON)   │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ LogService       │  ← Parse and validate JSON
│ (Parse/Validate) │
└────────┬─────────┘
         ↓
┌──────────────────┐
│ LogRouter        │  ← Route by logType
│ (Route by type)  │
└────────┬─────────┘
         ↓
    ┌────┴────┐
    ↓         ↓
┌─────────┐ ┌─────────┐
│API Logs │ │Error    │ ... (multiple indexes)
│ES Index │ │ES Index │
└─────────┘ └─────────┘
```

---

## Step-by-Step Implementation

### Step 1: Create Spring Boot Project Structure

**Duration**: 15 minutes

**Create Project Directory**:
```bash
cd /home/mack/my_workspace/microservices-starter/apps/services
mkdir -p log-java-service
cd log-java-service
```

**Create Maven Project Structure**:
```bash
mkdir -p src/main/java/com/polystack/logservice
mkdir -p src/main/resources
mkdir -p src/test/java/com/polystack/logservice
```

**Directory Structure**:
```
log-java-service/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── polystack/
│   │   │           └── logservice/
│   │   │               ├── LogServiceApplication.java
│   │   │               ├── config/
│   │   │               │   ├── KafkaConsumerConfig.java
│   │   │               │   └── ElasticsearchConfig.java
│   │   │               ├── model/
│   │   │               │   ├── LogMessage.java
│   │   │               │   ├── ApiLog.java
│   │   │               │   ├── ErrorLog.java
│   │   │               │   └── BusinessLog.java
│   │   │               ├── consumer/
│   │   │               │   └── LogConsumer.java
│   │   │               ├── service/
│   │   │               │   ├── LogService.java
│   │   │               │   └── LogRouter.java
│   │   │               ├── repository/
│   │   │               │   ├── ApiLogRepository.java
│   │   │               │   ├── ErrorLogRepository.java
│   │   │               │   └── BusinessLogRepository.java
│   │   │               └── controller/
│   │   │                   └── HealthController.java
│   │   └── resources/
│   │       ├── application.yml
│   │       └── application-dev.yml
│   └── test/
│       └── java/
│           └── com/
│               └── polystack/
│                   └── logservice/
├── pom.xml
├── Dockerfile
└── README.md
```

---

### Step 2: Create pom.xml (Maven Configuration)

**Duration**: 10 minutes

**File**: `pom.xml`

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
    <artifactId>log-service</artifactId>
    <version>1.0.0</version>
    <name>log-java-service</name>
    <description>Centralized logging service using Kafka and Elasticsearch</description>

    <properties>
        <java.version>17</java.version>
        <spring-kafka.version>3.1.0</spring-kafka.version>
    </properties>

    <dependencies>
        <!-- Spring Boot Starter -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter</artifactId>
        </dependency>

        <!-- Spring Boot Web (for REST endpoints and health checks) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Spring Kafka -->
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>

        <!-- Spring Data Elasticsearch -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-elasticsearch</artifactId>
        </dependency>

        <!-- Lombok (reduce boilerplate) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Jackson (JSON parsing) -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
        </dependency>

        <!-- Spring Boot Actuator (health checks, metrics) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
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
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

**Verify Maven Setup**:
```bash
mvn clean install

# Should download dependencies and build successfully
```

---

### Step 3: Create Application Configuration

**Duration**: 10 minutes

**File**: `src/main/resources/application.yml`

```yaml
spring:
  application:
    name: log-java-service

  # Kafka Configuration
  kafka:
    bootstrap-servers: ${KAFKA_BROKERS:localhost:9092}
    consumer:
      group-id: log-service-group
      auto-offset-reset: earliest  # Start from beginning for new consumers
      enable-auto-commit: true
      auto-commit-interval: 1000
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      properties:
        max.poll.records: 100
        session.timeout.ms: 30000

  # Elasticsearch Configuration
  elasticsearch:
    uris: ${ELASTICSEARCH_URIS:http://localhost:9200}
    connection-timeout: 5s
    socket-timeout: 30s

# Application-specific Configuration
app:
  kafka:
    topic: ${KAFKA_TOPIC:logs}

  elasticsearch:
    indexes:
      api: logs-api
      error: logs-error
      business: logs-business
      security: logs-security
      performance: logs-performance
      debug: logs-debug

# Logging Configuration
logging:
  level:
    root: INFO
    com.polystack.logservice: DEBUG
    org.springframework.kafka: INFO
    org.elasticsearch: WARN

# Actuator (Health Check) Configuration
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
  endpoint:
    health:
      show-details: always

server:
  port: ${PORT:8080}
```

**File**: `src/main/resources/application-dev.yml` (development overrides)

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092

  elasticsearch:
    uris: http://localhost:9200

logging:
  level:
    com.polystack.logservice: DEBUG
```

---

### Step 4: Create Main Application Class

**Duration**: 5 minutes

**File**: `src/main/java/com/polystack/logservice/LogServiceApplication.java`

```java
package com.polystack.logservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.elasticsearch.repository.config.EnableElasticsearchRepositories;
import org.springframework.kafka.annotation.EnableKafka;

@SpringBootApplication
@EnableKafka
@EnableElasticsearchRepositories
public class LogServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(LogServiceApplication.class, args);
    }
}
```

**Annotations Explained**:
- `@SpringBootApplication`: Main Spring Boot annotation
- `@EnableKafka`: Enable Kafka listeners
- `@EnableElasticsearchRepositories`: Enable Elasticsearch repositories

---

### Step 5: Create Model Classes (Log Entities)

**Duration**: 30 minutes

**File**: `src/main/java/com/polystack/logservice/model/LogMessage.java`

```java
package com.polystack.logservice.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.Instant;
import java.util.Map;

/**
 * Universal log message structure (matches TypeScript interface)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LogMessage {

    private Instant timestamp;

    private String level;  // debug, info, warn, error, fatal

    private String service;

    @JsonProperty("logType")
    private String logType;  // api, error, business, security, performance, debug

    private String message;

    private Map<String, Object> metadata;

    private String environment;

    private String hostname;

    private String version;
}
```

**File**: `src/main/java/com/polystack/logservice/model/ApiLog.java`

```java
package com.polystack.logservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.Instant;

/**
 * API request log entity for Elasticsearch
 */
@Document(indexName = "logs-api")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiLog {

    @Id
    private String id;

    @Field(type = FieldType.Date)
    private Instant timestamp;

    @Field(type = FieldType.Keyword)
    private String service;

    @Field(type = FieldType.Keyword)
    private String level;

    @Field(type = FieldType.Text)
    private String message;

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

    @Field(type = FieldType.Ip)
    private String ip;

    @Field(type = FieldType.Text)
    private String userAgent;

    @Field(type = FieldType.Keyword)
    private String environment;

    @Field(type = FieldType.Keyword)
    private String hostname;

    @Field(type = FieldType.Keyword)
    private String version;
}
```

**File**: `src/main/java/com/polystack/logservice/model/ErrorLog.java`

```java
package com.polystack.logservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.Instant;

/**
 * Error log entity for Elasticsearch
 */
@Document(indexName = "logs-error")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorLog {

    @Id
    private String id;

    @Field(type = FieldType.Date)
    private Instant timestamp;

    @Field(type = FieldType.Keyword)
    private String service;

    @Field(type = FieldType.Keyword)
    private String level;

    @Field(type = FieldType.Text)
    private String message;

    @Field(type = FieldType.Keyword)
    private String errorType;

    @Field(type = FieldType.Text)
    private String errorStack;

    @Field(type = FieldType.Keyword)
    private String errorCode;

    @Field(type = FieldType.Keyword)
    private String requestId;

    @Field(type = FieldType.Keyword)
    private String environment;

    @Field(type = FieldType.Keyword)
    private String hostname;

    @Field(type = FieldType.Keyword)
    private String version;
}
```

**File**: `src/main/java/com/polystack/logservice/model/BusinessLog.java`

```java
package com.polystack.logservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.elasticsearch.annotations.Document;
import org.springframework.data.elasticsearch.annotations.Field;
import org.springframework.data.elasticsearch.annotations.FieldType;

import java.time.Instant;

/**
 * Business event log entity for Elasticsearch
 */
@Document(indexName = "logs-business")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessLog {

    @Id
    private String id;

    @Field(type = FieldType.Date)
    private Instant timestamp;

    @Field(type = FieldType.Keyword)
    private String service;

    @Field(type = FieldType.Keyword)
    private String level;

    @Field(type = FieldType.Text)
    private String message;

    @Field(type = FieldType.Keyword)
    private String action;

    @Field(type = FieldType.Keyword)
    private String entity;

    @Field(type = FieldType.Keyword)
    private String entityId;

    @Field(type = FieldType.Keyword)
    private String userId;

    @Field(type = FieldType.Keyword)
    private String transactionId;

    @Field(type = FieldType.Keyword)
    private String environment;

    @Field(type = FieldType.Keyword)
    private String hostname;

    @Field(type = FieldType.Keyword)
    private String version;
}
```

**Why Separate Entity Classes?**
- Different indexes have different fields
- Type safety when indexing
- Better query performance (only relevant fields indexed)
- Easier to add index-specific fields later

---

### Step 6: Create Elasticsearch Repositories

**Duration**: 10 minutes

**File**: `src/main/java/com/polystack/logservice/repository/ApiLogRepository.java`

```java
package com.polystack.logservice.repository;

import com.polystack.logservice.model.ApiLog;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface ApiLogRepository extends ElasticsearchRepository<ApiLog, String> {

    // Custom query methods (Spring Data will implement automatically)
    List<ApiLog> findByService(String service);

    List<ApiLog> findByStatusCode(Integer statusCode);

    List<ApiLog> findByTimestampBetween(Instant start, Instant end);

    List<ApiLog> findByServiceAndStatusCode(String service, Integer statusCode);
}
```

**File**: `src/main/java/com/polystack/logservice/repository/ErrorLogRepository.java`

```java
package com.polystack.logservice.repository;

import com.polystack.logservice.model.ErrorLog;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ErrorLogRepository extends ElasticsearchRepository<ErrorLog, String> {

    List<ErrorLog> findByService(String service);

    List<ErrorLog> findByErrorType(String errorType);

    List<ErrorLog> findByServiceAndErrorType(String service, String errorType);
}
```

**File**: `src/main/java/com/polystack/logservice/repository/BusinessLogRepository.java`

```java
package com.polystack.logservice.repository;

import com.polystack.logservice.model.BusinessLog;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessLogRepository extends ElasticsearchRepository<BusinessLog, String> {

    List<BusinessLog> findByService(String service);

    List<BusinessLog> findByAction(String action);

    List<BusinessLog> findByEntity(String entity);

    List<BusinessLog> findByUserId(String userId);
}
```

**How Spring Data Works**:
- Method names define queries (e.g., `findByService` → query `service` field)
- No implementation needed - Spring generates it automatically
- Supports complex queries: `findByServiceAndStatusCode`

---

### Step 7: Create Log Router Service

**Duration**: 25 minutes

**File**: `src/main/java/com/polystack/logservice/service/LogRouter.java`

```java
package com.polystack.logservice.service;

import com.polystack.logservice.model.*;
import com.polystack.logservice.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

/**
 * Routes log messages to appropriate Elasticsearch indexes based on logType
 */
@Service
@Slf4j
public class LogRouter {

    @Autowired
    private ApiLogRepository apiLogRepository;

    @Autowired
    private ErrorLogRepository errorLogRepository;

    @Autowired
    private BusinessLogRepository businessLogRepository;

    /**
     * Route log message to correct index
     */
    public void route(LogMessage logMessage) {
        String logType = logMessage.getLogType();

        try {
            switch (logType) {
                case "api":
                    routeApiLog(logMessage);
                    break;

                case "error":
                    routeErrorLog(logMessage);
                    break;

                case "business":
                    routeBusinessLog(logMessage);
                    break;

                case "security":
                    // TODO: Implement security log routing
                    log.info("Security log received (not yet indexed): {}", logMessage.getMessage());
                    break;

                case "performance":
                    // TODO: Implement performance log routing
                    log.info("Performance log received (not yet indexed): {}", logMessage.getMessage());
                    break;

                case "debug":
                    // TODO: Implement debug log routing
                    log.debug("Debug log received (not yet indexed): {}", logMessage.getMessage());
                    break;

                default:
                    log.warn("Unknown log type: {}, message: {}", logType, logMessage.getMessage());
            }
        } catch (Exception e) {
            log.error("Failed to route log message: {}", logMessage, e);
        }
    }

    /**
     * Convert and save API log
     */
    private void routeApiLog(LogMessage msg) {
        Map<String, Object> metadata = msg.getMetadata();

        ApiLog apiLog = ApiLog.builder()
            .id(UUID.randomUUID().toString())
            .timestamp(msg.getTimestamp())
            .service(msg.getService())
            .level(msg.getLevel())
            .message(msg.getMessage())
            .requestId(getStringValue(metadata, "requestId"))
            .method(getStringValue(metadata, "method"))
            .path(getStringValue(metadata, "path"))
            .statusCode(getIntValue(metadata, "statusCode"))
            .responseTime(getLongValue(metadata, "responseTime"))
            .ip(getStringValue(metadata, "ip"))
            .userAgent(getStringValue(metadata, "userAgent"))
            .environment(msg.getEnvironment())
            .hostname(msg.getHostname())
            .version(msg.getVersion())
            .build();

        apiLogRepository.save(apiLog);
        log.debug("Saved API log to Elasticsearch: {}", apiLog.getId());
    }

    /**
     * Convert and save Error log
     */
    private void routeErrorLog(LogMessage msg) {
        Map<String, Object> metadata = msg.getMetadata();

        ErrorLog errorLog = ErrorLog.builder()
            .id(UUID.randomUUID().toString())
            .timestamp(msg.getTimestamp())
            .service(msg.getService())
            .level(msg.getLevel())
            .message(msg.getMessage())
            .errorType(getStringValue(metadata, "errorType"))
            .errorStack(getStringValue(metadata, "errorStack"))
            .errorCode(getStringValue(metadata, "errorCode"))
            .requestId(getStringValue(metadata, "requestId"))
            .environment(msg.getEnvironment())
            .hostname(msg.getHostname())
            .version(msg.getVersion())
            .build();

        errorLogRepository.save(errorLog);
        log.debug("Saved Error log to Elasticsearch: {}", errorLog.getId());
    }

    /**
     * Convert and save Business log
     */
    private void routeBusinessLog(LogMessage msg) {
        Map<String, Object> metadata = msg.getMetadata();

        BusinessLog businessLog = BusinessLog.builder()
            .id(UUID.randomUUID().toString())
            .timestamp(msg.getTimestamp())
            .service(msg.getService())
            .level(msg.getLevel())
            .message(msg.getMessage())
            .action(getStringValue(metadata, "action"))
            .entity(getStringValue(metadata, "entity"))
            .entityId(getStringValue(metadata, "entityId"))
            .userId(getStringValue(metadata, "userId"))
            .transactionId(getStringValue(metadata, "transactionId"))
            .environment(msg.getEnvironment())
            .hostname(msg.getHostname())
            .version(msg.getVersion())
            .build();

        businessLogRepository.save(businessLog);
        log.debug("Saved Business log to Elasticsearch: {}", businessLog.getId());
    }

    // Helper methods to safely extract values from metadata map

    private String getStringValue(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key)) {
            return null;
        }
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private Integer getIntValue(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key)) {
            return null;
        }
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    private Long getLongValue(Map<String, Object> map, String key) {
        if (map == null || !map.containsKey(key)) {
            return null;
        }
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        return null;
    }
}
```

---

### Step 8: Create Log Processing Service

**Duration**: 15 minutes

**File**: `src/main/java/com/polystack/logservice/service/LogService.java`

```java
package com.polystack.logservice.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.polystack.logservice.model.LogMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Main log processing service
 */
@Service
@Slf4j
public class LogService {

    @Autowired
    private LogRouter logRouter;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Process raw JSON log message from Kafka
     */
    public void processLog(String jsonMessage) {
        try {
            // Parse JSON to LogMessage object
            LogMessage logMessage = objectMapper.readValue(jsonMessage, LogMessage.class);

            // Validate required fields
            if (!isValid(logMessage)) {
                log.warn("Invalid log message received: {}", jsonMessage);
                return;
            }

            log.debug("Processing log from service: {}, type: {}",
                logMessage.getService(), logMessage.getLogType());

            // Route to appropriate index
            logRouter.route(logMessage);

        } catch (JsonProcessingException e) {
            log.error("Failed to parse log message JSON: {}", jsonMessage, e);
        } catch (Exception e) {
            log.error("Unexpected error processing log message: {}", jsonMessage, e);
        }
    }

    /**
     * Validate log message has required fields
     */
    private boolean isValid(LogMessage logMessage) {
        if (logMessage.getService() == null || logMessage.getService().isEmpty()) {
            log.warn("Log message missing 'service' field");
            return false;
        }

        if (logMessage.getLogType() == null || logMessage.getLogType().isEmpty()) {
            log.warn("Log message missing 'logType' field");
            return false;
        }

        if (logMessage.getTimestamp() == null) {
            log.warn("Log message missing 'timestamp' field");
            return false;
        }

        return true;
    }
}
```

---

### Step 9: Create Kafka Consumer

**Duration**: 15 minutes

**File**: `src/main/java/com/polystack/logservice/consumer/LogConsumer.java`

```java
package com.polystack.logservice.consumer;

import com.polystack.logservice.service.LogService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for log messages
 */
@Component
@Slf4j
public class LogConsumer {

    @Autowired
    private LogService logService;

    /**
     * Listen to 'logs' topic and process messages
     */
    @KafkaListener(
        topics = "${app.kafka.topic}",
        groupId = "${spring.kafka.consumer.group-id}",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(
        @Payload String message,
        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
        @Header(KafkaHeaders.OFFSET) long offset
    ) {
        log.debug("Received message from partition: {}, offset: {}", partition, offset);

        try {
            logService.processLog(message);
        } catch (Exception e) {
            log.error("Failed to process log message from Kafka: {}", message, e);
            // TODO: Send to Dead Letter Queue (DLQ)
        }
    }
}
```

**@KafkaListener Explained**:
- `topics`: Kafka topic to consume from (configured in `application.yml`)
- `groupId`: Consumer group ID (allows scaling with multiple instances)
- `@Payload`: Message content
- `@Header`: Kafka metadata (partition, offset)

---

### Step 10: Create Kafka Configuration

**Duration**: 10 minutes

**File**: `src/main/java/com/polystack/logservice/config/KafkaConsumerConfig.java`

```java
package com.polystack.logservice.config;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;

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
        Map<String, Object> config = new HashMap<>();

        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, true);

        return new DefaultKafkaConsumerFactory<>(config);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, String> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, String> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.setConcurrency(3); // Number of concurrent consumers (match partition count)
        return factory;
    }
}
```

**Configuration Breakdown**:
- `AUTO_OFFSET_RESET_CONFIG: earliest` - Start from beginning for new consumers
- `ENABLE_AUTO_COMMIT_CONFIG: true` - Automatically commit offsets
- `setConcurrency(3)` - 3 concurrent consumers (matches 3 Kafka partitions)

---

### Step 11: Create Health Check Endpoint

**Duration**: 10 minutes

**File**: `src/main/java/com/polystack/logservice/controller/HealthController.java`

```java
package com.polystack.logservice.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/health")
@Slf4j
public class HealthController {

    @Autowired
    private ElasticsearchOperations elasticsearchOperations;

    @Autowired(required = false)
    private KafkaAdmin kafkaAdmin;

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("service", "log-java-service");
        health.put("version", "1.0.0");

        // Check Elasticsearch connection
        try {
            boolean esHealthy = elasticsearchOperations.indexOps(org.springframework.data.elasticsearch.core.IndexOperations.class).exists();
            health.put("elasticsearch", esHealthy ? "UP" : "DOWN");
        } catch (Exception e) {
            health.put("elasticsearch", "DOWN");
            log.error("Elasticsearch health check failed", e);
        }

        // Check Kafka connection
        try {
            if (kafkaAdmin != null) {
                health.put("kafka", "UP");
            } else {
                health.put("kafka", "UNKNOWN");
            }
        } catch (Exception e) {
            health.put("kafka", "DOWN");
            log.error("Kafka health check failed", e);
        }

        return ResponseEntity.ok(health);
    }
}
```

---

### Step 12: Build and Run the Service

**Duration**: 15 minutes

**Build the Application**:
```bash
cd /home/mack/my_workspace/microservices-starter/apps/services/log-java-service

mvn clean package

# Should create target/log-service-1.0.0.jar
```

**Run the Application**:
```bash
# Option 1: Using Maven
mvn spring-boot:run

# Option 2: Using Java JAR
java -jar target/log-service-1.0.0.jar
```

**Expected Startup Logs**:
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::                (v3.2.0)

... Starting LogServiceApplication ...
... Started LogServiceApplication in 5.243 seconds
... Listening to Kafka topic: logs
```

**Verify Service is Running**:
```bash
# Check health endpoint
curl http://localhost:8080/health

# Expected: {"status":"UP","elasticsearch":"UP","kafka":"UP"}
```

---

### Step 13: Test End-to-End Flow

**Duration**: 20 minutes

**Test 1: Verify Kafka Consumer is Listening**

Check application logs for:
```
Listening to Kafka topic: logs
```

**Test 2: Generate Logs from Todo Service**

```bash
# Make API requests to generate logs
curl http://localhost:3100/api/v1/todos
curl http://localhost:3100/api/v1/todos/1
```

**Test 3: Check Java Service Logs**

You should see in log-java-service logs:
```
Received message from partition: 0, offset: 123
Processing log from service: todo-nodejs-service, type: api
Saved API log to Elasticsearch: abc-123-def-456
```

**Test 4: Verify Logs in Elasticsearch**

```bash
# Check if indexes exist
curl http://localhost:9200/_cat/indices?v

# Should show: logs-api, logs-error, logs-business

# Query API logs
curl http://localhost:9200/logs-api/_search?pretty

# Should return indexed API logs
```

**Test 5: Query Specific Log**

```bash
# Search for logs from todo-nodejs-service
curl -X GET "localhost:9200/logs-api/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match": {
      "service": "todo-nodejs-service"
    }
  }
}
'
```

**Test 6: Generate Error Log**

Trigger an error in todo service:
```bash
curl http://localhost:3100/api/v1/todos/invalid-id
```

Check error index:
```bash
curl http://localhost:9200/logs-error/_search?pretty
```

---

## Verification Checklist

After completing all steps:

- [ ] Java 17+ and Maven installed
- [ ] pom.xml created with all dependencies
- [ ] application.yml configured correctly
- [ ] All model classes created (LogMessage, ApiLog, ErrorLog, BusinessLog)
- [ ] Repositories created for each log type
- [ ] LogService and LogRouter implemented
- [ ] LogConsumer created with @KafkaListener
- [ ] Health check endpoint working
- [ ] Application builds successfully: `mvn clean package`
- [ ] Application starts without errors
- [ ] Kafka consumer connects and listens to `logs` topic
- [ ] Elasticsearch indexes created automatically
- [ ] Logs from todo service appear in Elasticsearch
- [ ] Health endpoint returns healthy status

---

## Docker Integration

**Duration**: 15 minutes

**Create Dockerfile**:

**File**: `Dockerfile`

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/log-service-1.0.0.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Build Docker Image**:
```bash
docker build -t polystack/log-java-service:latest .
```

**Add to Docker Compose**:

Edit `tools/local-dev/docker-compose.yml`:

```yaml
services:
  # ... existing services ...

  log-java-service:
    image: polystack/log-java-service:latest
    container_name: polystack-log-service
    ports:
      - "8080:8080"
    environment:
      - KAFKA_BROKERS=kafka:29092
      - ELASTICSEARCH_URIS=http://elasticsearch:9200
      - KAFKA_TOPIC=logs
    depends_on:
      kafka:
        condition: service_healthy
      elasticsearch:
        condition: service_healthy
    networks:
      - polystack-network
```

**Run via Docker Compose**:
```bash
docker-compose up -d log-java-service
```

---

## Troubleshooting

### Issue: "Failed to connect to Kafka"

**Check**:
```bash
# Verify Kafka is running
docker-compose ps kafka

# Check Kafka broker address
# Use 'kafka:29092' in Docker, 'localhost:9092' locally
```

### Issue: "No qualifying bean of type ElasticsearchOperations"

**Solution**: Add to `pom.xml`:
```xml
<dependency>
    <groupId>org.springframework.data</groupId>
    <artifactId>spring-data-elasticsearch</artifactId>
</dependency>
```

### Issue: "Indexes not created automatically"

**Manual Creation**:
```bash
curl -X PUT "localhost:9200/logs-api"
curl -X PUT "localhost:9200/logs-error"
curl -X PUT "localhost:9200/logs-business"
```

---

## Next Steps

After Phase 3:

1. **Phase 4**: Set up Kibana dashboards and visualizations
2. Create index patterns in Kibana
3. Build real-time monitoring dashboards
4. Set up alerts for error rates

---

## Success Criteria

Phase 3 is complete when:

- ✅ Spring Boot application builds and runs successfully
- ✅ Kafka consumer connects and consumes from `logs` topic
- ✅ Logs are parsed and validated correctly
- ✅ API logs indexed in `logs-api`
- ✅ Error logs indexed in `logs-error`
- ✅ Business logs indexed in `logs-business`
- ✅ Health check endpoint returns healthy status
- ✅ End-to-end flow works (todo service → Kafka → Java service → Elasticsearch)
- ✅ Docker image builds and runs

**Estimated Completion Time**: 4-6 hours

---

## References

- [Spring Kafka Documentation](https://docs.spring.io/spring-kafka/docs/current/reference/html/)
- [Spring Data Elasticsearch](https://docs.spring.io/spring-data/elasticsearch/docs/current/reference/html/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
