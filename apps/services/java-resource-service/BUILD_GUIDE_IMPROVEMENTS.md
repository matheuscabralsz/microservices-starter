# BUILD_GUIDE.md - Improvements & Fixes

This document lists improvements and fixes to apply after completing the initial BUILD_GUIDE.md implementation. These changes ensure full API compatibility with the Node.js service and fix minor issues.

---

## Critical Fixes

### 1. Add CORS Configuration

**Why:** The Node.js service enables CORS, but the Java guide doesn't include it. Without this, frontend applications on different origins will fail to call your API.

**File to create:** `src/main/java/com/polystack/resource/config/WebConfig.java`

```java
package com.polystack.resource.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web configuration including CORS settings.
 *
 * Educational Note:
 * CORS (Cross-Origin Resource Sharing) is a security feature that restricts
 * which domains can access your API. Without this config, browsers will block
 * requests from frontend apps running on different origins (e.g., localhost:3000).
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
```

---

### 2. Fix Error Code to Match Node.js API

**Why:** The Node.js service uses `NOT_FOUND` as the error code, but the guide uses `RESOURCE_NOT_FOUND`. For API compatibility, these must match.

**File:** `src/main/java/com/polystack/resource/exception/GlobalExceptionHandler.java`

**Change this:**
```java
.body(ApiResponse.error("RESOURCE_NOT_FOUND", ex.getMessage()));
```

**To this:**
```java
.body(ApiResponse.error("NOT_FOUND", ex.getMessage()));
```

---

### 3. Add Default Empty Array for Error Details

**Why:** Node.js errors include `details: []`, but the Java version doesn't initialize this field, causing `null` in JSON output.

**File:** `src/main/java/com/polystack/resource/dto/ApiResponse.java`

**Change the ErrorDetails class:**
```java
@Data
@Builder
public static class ErrorDetails {
    private String code;
    private String message;
    @Builder.Default
    private Object details = java.util.List.of();  // Default to empty array
}
```

---

## Moderate Fixes

### 4. Add Description Field Validation

**Why:** The Node.js schema limits description to 2000 characters, but the Java DTOs don't validate this.

**File:** `src/main/java/com/polystack/resource/dto/CreateResourceRequest.java`

**Add to description field:**
```java
@Size(max = 2000, message = "Description must not exceed 2000 characters")
private String description;
```

**File:** `src/main/java/com/polystack/resource/dto/UpdateResourceRequest.java`

**Add to description field:**
```java
@Size(max = 2000, message = "Description must not exceed 2000 characters")
private String description;
```

---

### 5. Make `completed` Required in Update Request

**Why:** In the Node.js PUT endpoint, `completed` is a required field. The Java version makes it optional.

**File:** `src/main/java/com/polystack/resource/dto/UpdateResourceRequest.java`

**Change:**
```java
private Boolean completed;
```

**To:**
```java
@NotNull(message = "Completed status is required")
private Boolean completed;
```

**File:** `src/main/java/com/polystack/resource/service/ResourceService.java`

**Change the update method (remove the null check):**
```java
@Transactional
public Resource update(UUID id, UpdateResourceRequest request) {
    Resource resource = findById(id);

    resource.setTitle(request.getTitle());
    resource.setDescription(request.getDescription());
    resource.setCompleted(request.getCompleted());  // Remove if-null check

    return resourceRepository.save(resource);
}
```

---

### 6. Handle Invalid UUID Format Errors

**Why:** When an invalid UUID is passed (e.g., `/api/v1/resources/not-a-uuid`), Spring throws `MethodArgumentTypeMismatchException`. This should return a clean error response.

**File:** `src/main/java/com/polystack/resource/exception/GlobalExceptionHandler.java`

**Add this import:**
```java
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
```

**Add this handler:**
```java
/**
 * Handles invalid path variable format (e.g., invalid UUID).
 */
@ExceptionHandler(MethodArgumentTypeMismatchException.class)
public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
    String message = String.format("Invalid value '%s' for parameter '%s'",
            ex.getValue(), ex.getName());
    return ResponseEntity
            .badRequest()
            .body(ApiResponse.error("VALIDATION_ERROR", message));
}
```

---

## Minor Fixes

### 7. Update Dependency Versions

**File:** `pom.xml`

**Update Spring Boot version (line ~68):**
```xml
<version>3.2.5</version>  <!-- Or check for latest 3.2.x / 3.3.x -->
```

**Update Springdoc version (line ~115):**
```xml
<version>2.8.4</version>  <!-- Or check for latest -->
```

---

### 8. Fix Dockerfile Health Check

**Why:** The Alpine JRE image may not have `wget` installed. Also, the start period is too short for Spring Boot.

**File:** `Dockerfile`

**Replace the health check section:**
```dockerfile
# Install curl for health checks
RUN apk add --no-cache curl

EXPOSE 3107

# Health check matching Node.js service
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3107/health || exit 1
```

**Note:** The `apk add` command must come before switching to `appuser`, so restructure as:

```dockerfile
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Install curl for health checks (must be done as root)
RUN apk add --no-cache curl

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# JVM optimization for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"

EXPOSE 3107

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3107/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

---

### 9. Add Table Naming Note

**Why:** The CLAUDE.md says tables should be singular (`resource`), but we use `resources` to match the existing Node.js service.

**File:** `BUILD_GUIDE.md` - Step 5

**Add this note after the `@Table` annotation explanation:**

> **Note on Table Naming:** The project CLAUDE.md recommends singular table names (`resource`),
> but we use `resources` (plural) to match the existing Node.js service and share the same
> database table. Consistency with existing services takes precedence here.

---

## Optional Enhancements

### 10. Add Request Logging

For debugging and monitoring, add request logging:

**File:** `src/main/resources/application.yml`

**Add under logging section:**
```yaml
logging:
  level:
    org.springframework.web: DEBUG  # Logs incoming requests
    org.springframework.web.servlet.mvc.method.annotation: TRACE  # Detailed request mapping
```

---

### 11. Add Integration Test for Invalid UUID

**File:** `src/test/java/com/polystack/resource/ResourceControllerIntegrationTest.java`

**Add this test:**
```java
@Test
void getById_withInvalidUuid_shouldReturn400() throws Exception {
    mockMvc.perform(get("/api/v1/resources/not-a-valid-uuid"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.success").value(false))
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
}
```

---

## Checklist

Use this checklist to track your progress:

- [ ] 1. Add CORS configuration (`WebConfig.java`)
- [ ] 2. Fix error code (`NOT_FOUND` instead of `RESOURCE_NOT_FOUND`)
- [ ] 3. Add default empty array for error details
- [ ] 4. Add `@Size` validation to description fields
- [ ] 5. Make `completed` required with `@NotNull`
- [ ] 6. Add invalid UUID error handler
- [ ] 7. Update dependency versions in `pom.xml`
- [ ] 8. Fix Dockerfile health check (curl + start period)
- [ ] 9. Add table naming note to BUILD_GUIDE.md
- [ ] 10. (Optional) Add request logging
- [ ] 11. (Optional) Add invalid UUID test

---

## Verification Commands

After implementing all fixes, verify with these commands:

```bash
# Build the project
mvn clean package

# Run tests
mvn test

# Start the service
mvn spring-boot:run

# Test CORS (from browser console or another origin)
fetch('http://localhost:3107/api/v1/resources')
  .then(r => r.json())
  .then(console.log)

# Test invalid UUID handling
curl http://localhost:3107/api/v1/resources/invalid-uuid

# Test error response format
curl http://localhost:3107/api/v1/resources/00000000-0000-0000-0000-000000000000
# Should return: {"success":false,"error":{"code":"NOT_FOUND","message":"...","details":[]}}
```
