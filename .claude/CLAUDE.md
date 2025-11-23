# PolyStack - Implementation Guide

## Repository Purpose

Polyglot microservices platform on Nx monorepo architecture for cloud deployment. Serves as learning project and production-ready starter kit.

**Main Goals:**
- Scalable microservices platform with polyglot development
- Micro-frontend architecture using module federation
- Comprehensive observability and cloud-agnostic IaC

---

## Project Structure

```
polystack/
├── apps/
│   ├── web/                      # Frontend (React, Angular, Vue, Astro)
│   ├── mobile/                   # Mobile (Flutter, React Native, Ionic)
│   ├── services/                 # Backend microservices (Node, Go, Python, Java, Rust)
│   └── monolith/                 # NestJS monolith (Clean Architecture + DDD)
├── libs/
│   ├── shared/                   # Shared utilities and types
│   └── ui-components/            # Design system
├── infrastructure/
│   ├── terraform/                # IaC (AWS, Azure, GCP)
│   ├── kubernetes/               # K8s manifests
│   └── docker/                   # Dockerfiles
├── docs/
│   ├── api-contracts/            # OpenAPI specs
│   ├── architecture/             # ADRs and diagrams
│   ├── implementation-plan.md    # 16 phases
└── tools/
    ├── generators/               # Nx generators
    └── local-dev/                # Docker Compose
```

---

## Development Workflow

### Local Setup
```bash
npm install

# Start infrastructure (PostgreSQL, Kafka, Kafka UI)
cd tools/local-dev && docker-compose up -d

# Run migrations (if DB exists)
./run-migrations.sh

# Fresh start (deletes all data)
docker-compose down -v && docker-compose up -d

# Serve applications
nx serve <project-name>
```

### Common Commands
```bash
# Development
nx serve <project-name> [--port=3100]

# Building
nx build <project-name> [--configuration=production]
nx run-many --target=build --all

# Testing
nx test <project-name> [--coverage]
nx e2e <project-name>-e2e

# Utilities
nx graph
nx affected:test
```

### Quality Gates
- ✅ Build succeeds
- ✅ Linting passes
- ✅ No critical security vulnerabilities
- ✅ Prerequisites complete

---

## Naming Convention

**Pattern**: `<purpose>-<language/framework>-<category>`

**Categories**: `web`, `app`, `service`, `worker`, `gateway`

**Examples**: `api-nest-service`, `dashboard-vue-web`, `auth-golang-service`

---

## Coding Standards

### General Principles
- **DRY**: Extract common code to `libs/shared`
- **Type Safety**: TypeScript strict mode, type hints in Python/Go
- **Error Handling**: Consistent across all services
- **Logging**: JSON structured logs with trace IDs

---

### Required Endpoints
```
GET /health       # Health check
GET /api/docs     # OpenAPI docs
```

### Standard Response
**Success**:
```json
{
  "success": true,
  "data": {},
  "meta": { "page": 1, "limit": 10, "total": 100 }
}
```

**Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{"field": "email", "message": "Invalid format"}]
  }
}
```

### HTTP Status Codes
- **200**: Success (GET, PUT, PATCH)
- **201**: Created (POST)
- **204**: No Content (DELETE)
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **500**: Internal Error

---

## Observability

### Logging Format (JSON)
```json
{
  "timestamp": "2025-10-13T10:30:00Z",
  "level": "info",
  "service": "api-nest-service",
  "traceId": "abc123",
  "message": "User authenticated",
  "context": {"userId": "user-123"}
}
```

**Levels**: `error`, `warn`, `info`, `debug`

### Required Metrics
- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- CPU/Memory usage
- Active connections

### Health Check Response
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {"database": "healthy", "redis": "healthy"}
}
```

---

## Git Workflow

### Branch Naming
- `feature/<name>`, `fix/<name>`, `docs/<name>`
- `refactor/<name>`, `test/<name>`, `chore/<name>`

### Commit Convention
```
<type>(<scope>): <description>

feat(api): add user pagination
fix(auth): resolve token refresh bug
docs(readme): update setup instructions
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**Guidelines**:
- Present tense, imperative mood
- First line ≤ 72 characters
- Reference issues in footer

---

## Docker Standards

### Standard Pattern
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

---

## Important Principles

1. **Local-First**: All services run locally via Docker Compose
2. **Start Simple**: Build ONE service type first, prove patterns
3**Security First**: Validate inputs, parameterized queries, rate limiting
4**Cloud-Agnostic**: Standard protocols, abstract cloud services
5**Observability Built-In**: Logs, metrics, traces from day one
6**Containerize Everything**: All services get Dockerfiles 
7**Automation First**: CI/CD, generators, Nx automation

---

---

## Event-Driven Architecture (Kafka)

### Local Infrastructure
```bash
cd tools/local-dev && docker-compose up -d
# PostgreSQL (5432), Kafka (9092), Kafka UI (8080)
```

### Event Schema
```typescript
{
  eventId: "uuid",
  eventType: "TODO_CREATED|TODO_UPDATED|TODO_COMPLETED|TODO_DELETED",
  timestamp: "ISO8601",
  userId: "string",
  todoId: "string",
  data: {},
  metadata: { source, version, correlationId }
}
```

### Kafka Topics
- `todo-events`: Main event stream (3 partitions)
- `todo-notifications`: Notification events (planned)
- `todo-analytics`: Analytics events (planned)

### Stack
- **Node.js**: Express + kafkajs (producer)
- **Java**: Spring Boot + Spring Kafka (consumers - planned)
- **KRaft Mode**: No Zookeeper

### Key Patterns
- Event sourcing with PostgreSQL event store
- Idempotent producers (`idempotent: true`)
- Current state projection from events
- Correlation IDs for distributed tracing

---

## Quick Reference

- **Implementation Plan**: `docs/implementation-plan.md`
- **Kafka Plan**: `docs/kafka-todo-implementation-plan.md`