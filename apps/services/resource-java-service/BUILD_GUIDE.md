# Building resource-java-service - A Step-by-Step Learning Guide

This guide will walk you through building a **Resource Management API** using Java and Spring Boot. It's the Java equivalent of `resource-nodejs-service`, following the same API contract and standards.

---

## What You'll Learn

- Spring Boot project setup and structure
- REST API development with Spring Web
- Database access with Spring Data JPA
- Input validation with Bean Validation (JSR-380)
- API documentation with SpringDoc OpenAPI (Swagger)
- Error handling and response standardization
- Docker containerization for microservices

---

## Prerequisites

- **Java 17+** (LTS recommended)
- **Maven 3.8+** or **Gradle 8+**
- **PostgreSQL** (or use the Docker Compose setup)
- **IDE**: IntelliJ IDEA, VS Code with Java extensions, or Eclipse

---

## Step 1: Initialize the Spring Boot Project

### Option A: Using Spring Initializr (Recommended for Learning)

1. Go to [start.spring.io](https://start.spring.io)
2. Configure:
   - **Project**: Maven
   - **Language**: Java
   - **Spring Boot**: 3.2.x (latest stable)
   - **Group**: `com.polystack`
   - **Artifact**: `resource-java-service`
   - **Packaging**: Jar
   - **Java**: 17

3. Add these dependencies:
   - **Spring Web** - For building REST APIs
   - **Spring Data JPA** - For database access with ORM
   - **PostgreSQL Driver** - Database connectivity
   - **Validation** - Bean validation (JSR-380)
   - **Spring Boot Actuator** - Health checks and monitoring
   - **Lombok** - Reduces boilerplate (optional but recommended)

4. Generate and extract to `apps/services/resource-java-service/`

### Option B: Manual pom.xml

Create `pom.xml` in `apps/services/resource-java-service/`:

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
    <artifactId>resource-java-service</artifactId>
    <version>0.1.0</version>
    <name>resource-java-service</name>
    <description>Resource Management API - Java/Spring Boot</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Web & REST -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Health Checks & Monitoring -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>

        <!-- API Documentation -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.3.0</version>
        </dependency>

        <!-- Lombok (optional - reduces boilerplate) -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
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

> **Educational Note**: The `spring-boot-starter-parent` provides dependency management,
> so you don't need to specify versions for most Spring dependencies. This is called
> "Bill of Materials" (BOM) pattern.

---

## Step 2: Project Structure

Create the following directory structure:

```
apps/services/resource-java-service/
├── src/
│   ├── main/
│   │   ├── java/com/polystack/resource/
│   │   │   ├── ResourceJavaServiceApplication.java  # Entry point
│   │   │   ├── config/
│   │   │   │   └── OpenApiConfig.java               # Swagger configuration
│   │   │   ├── controller/
│   │   │   │   ├── ResourceController.java          # REST endpoints
│   │   │   │   └── HealthController.java            # Health check
│   │   │   ├── dto/
│   │   │   │   ├── ApiResponse.java                 # Standard response wrapper
│   │   │   │   ├── ErrorResponse.java               # Error structure
│   │   │   │   ├── CreateResourceRequest.java       # Input DTO
│   │   │   │   └── UpdateResourceRequest.java       # Update DTO
│   │   │   ├── entity/
│   │   │   │   └── Resource.java                    # JPA Entity
│   │   │   ├── exception/
│   │   │   │   ├── GlobalExceptionHandler.java      # Centralized error handling
│   │   │   │   └── ResourceNotFoundException.java   # Custom exception
│   │   │   ├── repository/
│   │   │   │   └── ResourceRepository.java          # Data access layer
│   │   │   └── service/
│   │   │       └── ResourceService.java             # Business logic
│   │   └── resources/
│   │       └── application.yml                       # Configuration
│   └── test/
│       └── java/com/polystack/resource/
│           └── ResourceControllerIntegrationTest.java
├── pom.xml
├── Dockerfile
└── .env.example
```

> **Educational Note**: This is called "Package by Layer" structure. Spring Boot also
> supports "Package by Feature" where you group all related classes (controller, service,
> repository) by feature. Both are valid - choose based on project size.

---

## Step 3: Create the Main Application Class

**File**: `src/main/java/com/polystack/resource/ResourceJavaServiceApplication.java`

```java
package com.polystack.resource;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the Resource Java Service.
 *
 * Educational Note:
 * @SpringBootApplication is a convenience annotation that combines:
 * - @Configuration: Marks this as a source of bean definitions
 * - @EnableAutoConfiguration: Tells Spring Boot to auto-configure based on classpath
 * - @ComponentScan: Scans for @Component, @Service, @Repository, @Controller in this package
 */
@SpringBootApplication
public class ResourceJavaServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ResourceJavaServiceApplication.class, args);
    }
}
```

---

## Step 4: Configure Application Properties

**File**: `src/main/resources/application.yml`

```yaml
# Server Configuration
server:
  port: ${PORT:3107}  # Different port from Node.js service

# Database Configuration
spring:
  datasource:
    url: ${DATABASE_URL:jdbc:postgresql://localhost:5432/resources}
    username: ${DB_USERNAME:postgres}
    password: ${DB_PASSWORD:postgres}
    # Connection pool settings (HikariCP is default in Spring Boot)
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      idle-timeout: 30000
      connection-timeout: 2000

  jpa:
    hibernate:
      ddl-auto: update  # Auto-create/update tables (use 'validate' in production)
    show-sql: ${SHOW_SQL:false}
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.PostgreSQLDialect
    open-in-view: false  # Best practice: disable OSIV

# Actuator (Health Checks)
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: always

# OpenAPI / Swagger
springdoc:
  api-docs:
    path: /api/docs/openapi
  swagger-ui:
    path: /api/docs

# Logging
logging:
  level:
    root: ${LOG_LEVEL:INFO}
    com.polystack: DEBUG
    org.hibernate.SQL: ${SHOW_SQL:INFO}
```

> **Educational Note**: Spring Boot uses a powerful property binding system.
> `${PORT:3107}` means "use environment variable PORT, or default to 3107".
> YAML is preferred over .properties for its hierarchical structure.

---

## Step 5: Create the Entity (JPA Model)

**File**: `src/main/java/com/polystack/resource/entity/Resource.java`

```java
package com.polystack.resource.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA Entity representing a Resource in the database.
 *
 * Educational Note:
 * - @Entity marks this as a JPA entity (maps to a database table)
 * - @Table allows customizing the table name and adding indexes
 * - @Data (Lombok) generates getters, setters, equals, hashCode, toString
 * - @Builder enables the Builder pattern for object creation
 */
@Entity
@Table(
    name = "resources",
    indexes = @Index(name = "idx_resources_completed", columnList = "completed")
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {

    /**
     * Educational Note:
     * - GenerationType.UUID is new in Hibernate 6 / JPA 3.1
     * - Automatically generates UUIDs without manual intervention
     * - PostgreSQL stores this efficiently as a native UUID type
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    @Builder.Default
    private Boolean completed = false;

    /**
     * Educational Note:
     * - @CreationTimestamp auto-populates on INSERT
     * - @UpdateTimestamp auto-updates on UPDATE
     * - Instant is preferred over LocalDateTime for timestamps (timezone-safe)
     */
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
```

> **Without Lombok**: If you choose not to use Lombok, you'll need to manually write:
> - Constructor(s)
> - Getters and Setters for all fields
> - equals() and hashCode() methods
> - toString() method
> - Builder class (optional)

---

## Step 6: Create the Repository (Data Access Layer)

**File**: `src/main/java/com/polystack/resource/repository/ResourceRepository.java`

```java
package com.polystack.resource.repository;

import com.polystack.resource.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Resource entity.
 *
 * Educational Note:
 * Spring Data JPA provides CRUD operations automatically when you extend JpaRepository.
 * You get these methods for FREE:
 * - save(entity), saveAll(entities)
 * - findById(id), findAll()
 * - deleteById(id), delete(entity)
 * - count(), existsById(id)
 *
 * The generic parameters are: JpaRepository<EntityType, IdType>
 */
@Repository
public interface ResourceRepository extends JpaRepository<Resource, UUID> {

    /**
     * Educational Note:
     * Spring Data JPA uses "Query Derivation" - it creates SQL from method names!
     * This method generates: SELECT * FROM resources ORDER BY created_at DESC
     *
     * Naming convention: findBy + PropertyName + OrderBy + PropertyName + Desc/Asc
     */
    List<Resource> findAllByOrderByCreatedAtDesc();

    /**
     * Example of filtering by a field.
     * Generates: SELECT * FROM resources WHERE completed = ? ORDER BY created_at DESC
     */
    List<Resource> findByCompletedOrderByCreatedAtDesc(Boolean completed);
}
```

---

## Step 7: Create DTOs (Data Transfer Objects)

DTOs separate your API contract from your internal entity structure. This is a best practice.

### 7.1 Standard API Response Wrapper

**File**: `src/main/java/com/polystack/resource/dto/ApiResponse.java`

```java
package com.polystack.resource.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

/**
 * Standard API response wrapper matching the project convention.
 *
 * Educational Note:
 * Using a wrapper ensures consistent API responses across all endpoints.
 * The generic type T allows this to wrap any data type.
 *
 * @JsonInclude(NON_NULL) omits null fields from JSON output
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private ErrorDetails error;
    private Meta meta;

    // Factory methods for cleaner controller code
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data, Meta meta) {
        return ApiResponse.<T>builder()
                .success(true)
                .data(data)
                .meta(meta)
                .build();
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .success(false)
                .error(ErrorDetails.builder()
                        .code(code)
                        .message(message)
                        .build())
                .build();
    }

    @Data
    @Builder
    public static class ErrorDetails {
        private String code;
        private String message;
        private Object details;
    }

    @Data
    @Builder
    public static class Meta {
        private Integer page;
        private Integer total;
    }
}
```

### 7.2 Request DTOs

**File**: `src/main/java/com/polystack/resource/dto/CreateResourceRequest.java`

```java
package com.polystack.resource.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for creating a new Resource.
 *
 * Educational Note:
 * - @NotBlank: must not be null AND must contain at least one non-whitespace character
 * - @Size: validates string length
 * - These are Bean Validation (JSR-380) annotations
 * - Spring automatically validates when you use @Valid in controller
 */
@Data
public class CreateResourceRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;
}
```

**File**: `src/main/java/com/polystack/resource/dto/UpdateResourceRequest.java`

```java
package com.polystack.resource.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for updating an existing Resource.
 */
@Data
public class UpdateResourceRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    private String title;

    private String description;

    private Boolean completed;
}
```

---

## Step 8: Create Custom Exception

**File**: `src/main/java/com/polystack/resource/exception/ResourceNotFoundException.java`

```java
package com.polystack.resource.exception;

import java.util.UUID;

/**
 * Custom exception for when a Resource is not found.
 *
 * Educational Note:
 * Creating custom exceptions improves code readability and allows
 * for specific handling in the GlobalExceptionHandler.
 * Extending RuntimeException makes it an unchecked exception.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(UUID id) {
        super("Resource not found with id: " + id);
    }

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
```

---

## Step 9: Create Global Exception Handler

**File**: `src/main/java/com/polystack/resource/exception/GlobalExceptionHandler.java`

```java
package com.polystack.resource.exception;

import com.polystack.resource.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for the entire application.
 *
 * Educational Note:
 * @RestControllerAdvice combines @ControllerAdvice and @ResponseBody.
 * It intercepts exceptions thrown by any @Controller and converts them
 * to proper HTTP responses. This centralizes error handling logic.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles ResourceNotFoundException -> 404 Not Found
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("RESOURCE_NOT_FOUND", ex.getMessage()));
    }

    /**
     * Handles validation errors from @Valid annotation -> 400 Bad Request
     *
     * Educational Note:
     * MethodArgumentNotValidException is thrown when @Valid validation fails
     * on a @RequestBody. We extract field errors and return them in a structured way.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );

        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .success(false)
                .error(ApiResponse.ErrorDetails.builder()
                        .code("VALIDATION_ERROR")
                        .message("Validation failed")
                        .details(errors)
                        .build())
                .build();

        return ResponseEntity.badRequest().body(response);
    }

    /**
     * Handles constraint violations -> 400 Bad Request
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex) {
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error("VALIDATION_ERROR", ex.getMessage()));
    }

    /**
     * Catch-all for unexpected errors -> 500 Internal Server Error
     *
     * Educational Note:
     * Always have a generic handler to prevent stack traces from leaking to clients.
     * Log the full error server-side for debugging.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneric(Exception ex) {
        // In production, log this: log.error("Unexpected error", ex);
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("INTERNAL_ERROR", "An unexpected error occurred"));
    }
}
```

---

## Step 10: Create the Service Layer

**File**: `src/main/java/com/polystack/resource/service/ResourceService.java`

```java
package com.polystack.resource.service;

import com.polystack.resource.dto.CreateResourceRequest;
import com.polystack.resource.dto.UpdateResourceRequest;
import com.polystack.resource.entity.Resource;
import com.polystack.resource.exception.ResourceNotFoundException;
import com.polystack.resource.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service layer containing business logic for Resource operations.
 *
 * Educational Note:
 * - @Service marks this as a Spring service component (semantic stereotype)
 * - @RequiredArgsConstructor (Lombok) generates constructor for final fields
 * - This enables Constructor Injection (preferred over @Autowired field injection)
 * - @Transactional ensures database operations are atomic
 */
@Service
@RequiredArgsConstructor
public class ResourceService {

    private final ResourceRepository resourceRepository;

    /**
     * Get all resources ordered by creation date (newest first).
     */
    @Transactional(readOnly = true)
    public List<Resource> findAll() {
        return resourceRepository.findAllByOrderByCreatedAtDesc();
    }

    /**
     * Find a resource by ID.
     * @throws ResourceNotFoundException if not found
     */
    @Transactional(readOnly = true)
    public Resource findById(UUID id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(id));
    }

    /**
     * Create a new resource.
     *
     * Educational Note:
     * The Builder pattern makes object creation clean and readable.
     * The repository.save() method returns the saved entity with generated ID.
     */
    @Transactional
    public Resource create(CreateResourceRequest request) {
        Resource resource = Resource.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .completed(false)
                .build();

        return resourceRepository.save(resource);
    }

    /**
     * Update an existing resource (full replacement).
     */
    @Transactional
    public Resource update(UUID id, UpdateResourceRequest request) {
        Resource resource = findById(id);

        resource.setTitle(request.getTitle());
        resource.setDescription(request.getDescription());

        if (request.getCompleted() != null) {
            resource.setCompleted(request.getCompleted());
        }

        return resourceRepository.save(resource);
    }

    /**
     * Toggle the completed status of a resource.
     */
    @Transactional
    public Resource toggle(UUID id) {
        Resource resource = findById(id);
        resource.setCompleted(!resource.getCompleted());
        return resourceRepository.save(resource);
    }

    /**
     * Delete a resource by ID.
     *
     * Educational Note:
     * We first check if it exists to throw a proper 404 error.
     * Without this check, deleteById would silently do nothing if ID doesn't exist.
     */
    @Transactional
    public void delete(UUID id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException(id);
        }
        resourceRepository.deleteById(id);
    }
}
```

---

## Step 11: Create the REST Controller

**File**: `src/main/java/com/polystack/resource/controller/ResourceController.java`

```java
package com.polystack.resource.controller;

import com.polystack.resource.dto.ApiResponse;
import com.polystack.resource.dto.CreateResourceRequest;
import com.polystack.resource.dto.UpdateResourceRequest;
import com.polystack.resource.entity.Resource;
import com.polystack.resource.service.ResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Resource endpoints.
 *
 * Educational Note:
 * - @RestController = @Controller + @ResponseBody (returns JSON by default)
 * - @RequestMapping sets the base path for all endpoints in this controller
 * - @Valid triggers Bean Validation on request bodies
 * - ResponseEntity gives full control over HTTP response (status, headers, body)
 */
@RestController
@RequestMapping("/api/v1/resources")
@RequiredArgsConstructor
@Tag(name = "Resources", description = "Resource management endpoints")
public class ResourceController {

    private final ResourceService resourceService;

    /**
     * GET /api/v1/resources - List all resources
     */
    @GetMapping
    @Operation(summary = "List all resources", description = "Returns all resources ordered by creation date")
    public ResponseEntity<ApiResponse<List<Resource>>> getAll() {
        List<Resource> resources = resourceService.findAll();
        return ResponseEntity.ok(ApiResponse.success(resources));
    }

    /**
     * GET /api/v1/resources/{id} - Get single resource
     *
     * Educational Note:
     * @PathVariable extracts the {id} from the URL path.
     * UUID is automatically parsed from the string - if invalid, Spring returns 400.
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get resource by ID")
    public ResponseEntity<ApiResponse<Resource>> getById(@PathVariable UUID id) {
        Resource resource = resourceService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(resource));
    }

    /**
     * POST /api/v1/resources - Create new resource
     *
     * Educational Note:
     * - @RequestBody deserializes JSON to CreateResourceRequest
     * - @Valid runs Bean Validation (throws MethodArgumentNotValidException if invalid)
     * - HttpStatus.CREATED (201) is the correct status for successful resource creation
     */
    @PostMapping
    @Operation(summary = "Create a new resource")
    public ResponseEntity<ApiResponse<Resource>> create(
            @Valid @RequestBody CreateResourceRequest request) {
        Resource resource = resourceService.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(resource));
    }

    /**
     * PUT /api/v1/resources/{id} - Update resource (full replacement)
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update an existing resource")
    public ResponseEntity<ApiResponse<Resource>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateResourceRequest request) {
        Resource resource = resourceService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(resource));
    }

    /**
     * PATCH /api/v1/resources/{id} - Toggle completed status
     *
     * Educational Note:
     * PATCH is used for partial updates. Here we're only toggling 'completed'.
     * This matches the behavior of the Node.js service.
     */
    @PatchMapping("/{id}")
    @Operation(summary = "Toggle resource completion status")
    public ResponseEntity<ApiResponse<Resource>> toggle(@PathVariable UUID id) {
        Resource resource = resourceService.toggle(id);
        return ResponseEntity.ok(ApiResponse.success(resource));
    }

    /**
     * DELETE /api/v1/resources/{id} - Delete resource
     *
     * Educational Note:
     * HttpStatus.NO_CONTENT (204) is the standard response for successful DELETE.
     * The body is empty - just the status code indicates success.
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a resource")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        resourceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

---

## Step 12: Create Health Controller

**File**: `src/main/java/com/polystack/resource/controller/HealthController.java`

```java
package com.polystack.resource.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Map;

/**
 * Health check endpoint matching the Node.js service behavior.
 *
 * Educational Note:
 * Spring Boot Actuator provides /actuator/health automatically, but we
 * create a custom /health endpoint to match the existing API contract.
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Health", description = "Health check endpoint")
public class HealthController {

    private final DataSource dataSource;

    /**
     * GET /health - Check service health including database connectivity
     */
    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Returns service health status")
    public ResponseEntity<Map<String, String>> health() {
        try (Connection connection = dataSource.getConnection()) {
            // Simple query to verify database connectivity
            connection.createStatement().execute("SELECT 1");
            return ResponseEntity.ok(Map.of("status", "healthy"));
        } catch (Exception e) {
            // Database unreachable but service is running
            return ResponseEntity.ok(Map.of("status", "degraded"));
        }
    }
}
```

---

## Step 13: Configure OpenAPI/Swagger

**File**: `src/main/java/com/polystack/resource/config/OpenApiConfig.java`

```java
package com.polystack.resource.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration.
 *
 * Educational Note:
 * @Configuration marks this as a source of bean definitions.
 * @Bean methods return objects that Spring manages in its IoC container.
 * SpringDoc automatically generates OpenAPI spec from your controllers.
 */
@Configuration
public class OpenApiConfig {

    @Value("${server.port:3107}")
    private int serverPort;

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Resource API (Java)")
                        .version("0.1.0")
                        .description("A RESTful API service for managing resources, built with Spring Boot and PostgreSQL"))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Development server")
                ));
    }
}
```

---

## Step 14: Create Dockerfile

**File**: `Dockerfile`

```dockerfile
# Multi-stage build for smaller final image

# Stage 1: Build
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn package -DskipTests -B

# Stage 2: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# JVM optimization for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 3107

# Health check matching Node.js service
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3107/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

> **Educational Note**: Multi-stage builds reduce final image size dramatically.
> The build stage (~800MB) is discarded, and only the JRE + JAR (~200MB) remain.

---

## Step 15: Create Environment Example File

**File**: `.env.example`

```bash
# Server
PORT=3107
LOG_LEVEL=INFO

# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/resources
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JPA
SHOW_SQL=false
```

---

## Step 16: Update Docker Compose

Add the new service to `tools/local-dev/docker-compose.yml`:

```yaml
  resource-java-service:
    build:
      context: ../../apps/services/resource-java-service
      dockerfile: Dockerfile
    ports:
      - "3107:3107"
    environment:
      - PORT=3107
      - DATABASE_URL=jdbc:postgresql://postgres:5432/resources
      - DB_USERNAME=postgres
      - DB_PASSWORD=postgres
      - LOG_LEVEL=INFO
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3107/health"]
      interval: 30s
      timeout: 3s
      start_period: 30s
      retries: 3
```

---

## Step 17: Write Integration Tests (Optional but Recommended)

**File**: `src/test/java/com/polystack/resource/ResourceControllerIntegrationTest.java`

```java
package com.polystack.resource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.polystack.resource.dto.CreateResourceRequest;
import com.polystack.resource.entity.Resource;
import com.polystack.resource.repository.ResourceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for ResourceController.
 *
 * Educational Note:
 * - @SpringBootTest loads the full application context
 * - @AutoConfigureMockMvc provides MockMvc for testing HTTP endpoints
 * - MockMvc simulates HTTP requests without starting a real server
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")  // Uses application-test.yml if exists
class ResourceControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ResourceRepository resourceRepository;

    @BeforeEach
    void setUp() {
        resourceRepository.deleteAll();
    }

    @Test
    void healthCheck_shouldReturnHealthy() throws Exception {
        mockMvc.perform(get("/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("healthy"));
    }

    @Test
    void createResource_shouldReturnCreated() throws Exception {
        CreateResourceRequest request = new CreateResourceRequest();
        request.setTitle("Test Resource");
        request.setDescription("Test Description");

        mockMvc.perform(post("/api/v1/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Resource"))
                .andExpect(jsonPath("$.data.id").exists());
    }

    @Test
    void getAllResources_shouldReturnList() throws Exception {
        // Create test data
        Resource resource = Resource.builder()
                .title("Test")
                .description("Desc")
                .build();
        resourceRepository.save(resource);

        mockMvc.perform(get("/api/v1/resources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    void createResource_withoutTitle_shouldReturn400() throws Exception {
        CreateResourceRequest request = new CreateResourceRequest();
        // Missing required title

        mockMvc.perform(post("/api/v1/resources")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }
}
```

Create a test profile for H2 in-memory database:

**File**: `src/test/resources/application-test.yml`

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    database-platform: org.hibernate.dialect.H2Dialect
```

Add H2 test dependency to `pom.xml`:

```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

---

## Step 18: Build and Run

### Local Development (without Docker)

```bash
# Navigate to service directory
cd apps/services/resource-java-service

# Build (skip tests for quick iteration)
mvn clean package -DskipTests

# Run
java -jar target/resource-java-service-0.1.0.jar

# Or use Spring Boot Maven plugin (auto-reloads)
mvn spring-boot:run
```

### Run Tests

```bash
mvn test
```

### With Docker Compose

```bash
cd tools/local-dev
docker-compose up resource-java-service postgres
```

---

## Step 19: Verify Everything Works

1. **Health Check**: `curl http://localhost:3107/health`
   - Expected: `{"status":"healthy"}`

2. **Swagger UI**: Open `http://localhost:3107/api/docs`
   - Should see interactive API documentation

3. **Create Resource**:
   ```bash
   curl -X POST http://localhost:3107/api/v1/resources \
     -H "Content-Type: application/json" \
     -d '{"title":"Learn Spring","description":"Build Java service"}'
   ```

4. **List Resources**: `curl http://localhost:3107/api/v1/resources`

---

## Summary: Key Differences from Node.js

| Aspect | Node.js (Fastify) | Java (Spring Boot) |
|--------|-------------------|-------------------|
| Package Manager | npm | Maven/Gradle |
| Type Safety | TypeScript | Java (native) |
| Validation | TypeBox | Bean Validation |
| ORM | Raw SQL (pg) | Spring Data JPA |
| API Docs | fastify-swagger | springdoc-openapi |
| Boilerplate | Minimal | More (mitigated by Lombok) |
| Startup Time | ~100ms | ~2-3 seconds |
| Memory | ~50MB | ~200MB |

---

## Further Learning Resources

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Spring Data JPA Guide](https://spring.io/guides/gs/accessing-data-jpa/)
- [Bean Validation Cheatsheet](https://www.baeldung.com/javax-validation)
- [SpringDoc OpenAPI](https://springdoc.org/)
- [Lombok Features](https://projectlombok.org/features/)

---

Good luck with your learning journey! If you get stuck, refer back to the Node.js service implementation for reference.
