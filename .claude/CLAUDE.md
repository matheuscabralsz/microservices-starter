# PolyStack - Claude Code Implementation Guide

## Repository Purpose

PolyStack is a comprehensive polyglot microservices platform built on an Nx monorepo architecture, designed for cloud deployment (AWS/Azure/GCP). This repository serves as both a **learning project** and a **production-ready starter kit** for future microservices projects.

**Main Goals:**
- Create a scalable, production-ready microservices platform
- Enable polyglot development with standardized patterns across multiple languages
- Implement micro-frontend architecture using module federation
- Provide comprehensive observability and monitoring
- Deliver cloud-agnostic infrastructure as code
- Achieve 80%+ test coverage across all services
- Maintain minimal cost during development (local-first approach)

**Success Criteria:**
- All services running locally via Docker Compose
- CI/CD pipeline deploying to Kubernetes
- Full observability stack operational (metrics, logs, traces)
- API documentation auto-generated and accessible
- All quality gates passing (tests, builds, security scans)

---

## Project Structure

```
polystack/
├── apps/
│   ├── web/                      # Frontend applications
│   │   ├── shell-react-web/      # Module federation host (React)
│   │   ├── api-react-web/        # API explorer (React)
│   │   ├── api-angular-web/      # API docs UI (Angular)
│   │   ├── auth-react-web/       # Auth flows (React)
│   │   ├── checkout-react-web/   # Payment checkout (React)
│   │   ├── dashboard-vue-web/    # Admin dashboard (Vue)
│   │   ├── admin-angular-web/    # Admin panel (Angular)
│   │   └── marketing-astro-web/  # Marketing site (Astro)
│   ├── mobile/                   # Mobile applications
│   │   ├── mobile-flutter-app/
│   │   ├── mobile-react-native-app/
│   │   └── mobile-ionic-app/
│   └── services/                 # Backend microservices
│       ├── auth-nodejs-service/
│       ├── auth-golang-service/
│       ├── api-nest-service/
│       ├── api-spring-service/
│       ├── api-golang-service/
│       ├── api-fastapi-service/
│       ├── api-rust-service/
│       ├── payment-golang-service/
│       ├── payment-stripe-service/
│       ├── notification-nodejs-service/
│       ├── analytics-python-service/
│       ├── worker-nodejs-service/
│       ├── worker-python-service/
│       └── worker-rust-service/
├── libs/
│   ├── shared/                   # Shared utilities and types
│   ├── ui-components/            # Design system (shared-playbook)
│   └── shared-mobile-components/ # Mobile components
├── infrastructure/
│   ├── terraform/                # Infrastructure as Code
│   │   ├── modules/
│   │   ├── aws/
│   │   ├── azure/
│   │   └── gcp/
│   ├── kubernetes/               # K8s manifests
│   │   ├── base/
│   │   └── overlays/
│   └── docker/                   # Dockerfiles
├── docs/
│   ├── api-contracts/            # OpenAPI specifications
│   ├── architecture/             # ADRs and diagrams
│   ├── initial-idea.md           # Technical reference
│   ├── implementation-plan.md    # 16 phases with dependencies
│   └── PROGRESS.md               # Progress tracker
├── tools/
│   ├── generators/               # Nx code generators
│   └── local-dev/                # Docker Compose for local dev
│       └── docker-compose.yml
└── .github/
    └── workflows/                # CI/CD pipelines
```

---

## Technology Stack

### Frontend Technologies
- **React 18**: Primary framework for micro-frontends
- **Angular 17**: Alternative framework for API docs and admin
- **Vue 3**: Admin dashboard
- **Astro**: Static marketing site
- **Module Federation**: Webpack 5 for micro-frontend architecture
- **Testing**: Jest, Vitest (unit), Playwright, Cypress (E2E)

### Backend Technologies
- **Node.js/NestJS**: Primary TypeScript backend framework
- **Go/Gin**: High-performance services
- **Python/FastAPI**: Data and analytics services
- **Java/Spring Boot**: Enterprise patterns
- **Rust/Actix-web**: Performance-critical services
- **Node.js/Fastify**: Lightweight auth services

### Mobile Technologies
- **Flutter**: Cross-platform (iOS, Android, Web)
- **React Native**: iOS and Android
- **Ionic + Angular**: Hybrid mobile apps

### Infrastructure & Databases
- **Databases**: PostgreSQL, MongoDB, Redis
- **Message Queues**: Kafka, RabbitMQ
- **Storage**: MinIO (S3-compatible)
- **Observability**: Prometheus, Grafana, Jaeger, ELK Stack
- **API Gateway**: Kong, Nginx
- **Container**: Docker
- **Orchestration**: Kubernetes
- **IaC**: Terraform
- **CI/CD**: GitHub Actions, ArgoCD

---

## Development Workflow

### Local Development Setup

1. **Prerequisites**:
   ```bash
   Node.js 18+
   Docker & Docker Compose
   Git
   Language-specific tools (Go, Python, Java, Rust as needed)
   ```

2. **Initial Setup**:
   ```bash
   # Clone repository
   git clone <repo-url>
   cd microservices-starter

   # Install dependencies
   npm install

   # Start local infrastructure
   cd tools/local-dev
   docker-compose up -d

   # Verify infrastructure health
   docker-compose ps
   ```

3. **Running Services**:
   ```bash
   # Serve specific project
   nx serve <project-name>

   # Examples:
   nx serve api-nest-service --port=3100
   nx serve shell-react-web --port=3000
   ```

4. **Building Projects**:
   ```bash
   # Build single project
   nx build <project-name>

   # Build all projects
   nx run-many --target=build --all

   # Build with production config
   nx build <project-name> --configuration=production
   ```

5. **Testing**:
   ```bash
   # Run unit tests
   nx test <project-name>

   # Run with coverage
   nx test <project-name> --coverage

   # Run all tests
   nx run-many --target=test --all

   # E2E tests
   nx e2e <project-name>-e2e
   ```

6. **Linting**:
   ```bash
   # Lint single project
   nx lint <project-name>

   # Lint all projects
   nx run-many --target=lint --all
   ```

### Quality Gates (All Phases)

**Before marking any phase complete, ensure:**
- ✅ All tests pass (unit, integration, E2E as applicable)
- ✅ Build succeeds for all affected projects
- ✅ Code coverage meets 80% threshold
- ✅ Linting passes with no errors
- ✅ Security scans show no critical vulnerabilities
- ✅ All prerequisite phases are complete

**Testing Strategy:**
- **Unit Tests**: Fast, isolated, mock dependencies (80% coverage minimum)
- **Integration Tests**: Real database/message queue interactions
- **E2E Tests**: Full user flows through the system
- **Smoke Tests**: Post-deployment validation

---

## Implementation Phases

This project follows a **16-phase implementation plan** defined in `docs/implementation-plan.md`. Each phase has clear prerequisites, steps, quality gates, and deliverables.

### Phase Execution Order

**Priority 1 - Foundation (Start Here):**
1. ✅ Phase 1: Core Foundation & Nx Monorepo Setup
2. ✅ Phase 3: Local Development Infrastructure

**Priority 2 - Basic Backend:**
3. ✅ Phase 4: Authentication Services (start with ONE - nodejs)
4. ✅ Phase 5: Core API Services (start with ONE - NestJS)

**Priority 3 - Basic Frontend:**
5. ✅ Phase 2: Shared Libraries (build only what's needed)
6. ✅ Phase 6: Web Applications (start with 2-3 apps)

**Expand Incrementally:**
- Add more languages/frameworks once patterns are proven
- Follow dependency chain in implementation-plan.md
- Track progress in `docs/PROGRESS.md`

**Production Ready:**
- Phase 12: Observability
- Phase 14: Infrastructure as Code
- Phase 15: CI/CD Pipeline
- Phase 16: Documentation

### Critical Path
Phase 1 → Phase 2 → Phase 4 → Phase 5 → Phase 14 → Phase 15 → Phase 16

### Parallel Execution Opportunities
- Phases 1, 3, 12, 13 can start immediately (no dependencies)
- After Phase 1: Phases 2, 4, 8, 9, 10, 11 can run in parallel
- After Phases 1, 2, 4: Phase 5 can start
- After Phases 1, 2, 5: Phase 6 can start

**Reference**: See `docs/implementation-plan.md` for detailed steps, quality gates, and deliverables for each phase.

**Progress Tracking**: Update `docs/PROGRESS.md` after completing each step or phase.

---

## Naming Convention

**Pattern**: `<purpose>-<language-or-framework>-<category>`

**Categories**:
- `web` - Frontend applications
- `app` - Mobile applications
- `service` - Backend microservices
- `worker` - Background processors
- `gateway` - API gateways

**Examples**:
- `api-nest-service` (API service built with NestJS)
- `dashboard-vue-web` (Dashboard built with Vue)
- `worker-rust-service` (Worker service built with Rust)
- `auth-golang-service` (Auth service built with Go)

---

## Coding Conventions

### General Principles
- **DRY**: Don't Repeat Yourself - extract common code to `libs/shared`
- **SOLID**: Follow SOLID principles for backend services
- **Type Safety**: Use TypeScript strict mode, Go type safety, etc.
- **Error Handling**: Consistent error handling across all services
- **Logging**: JSON structured logging with trace IDs
- **Testing**: Write tests before marking features complete

### TypeScript/JavaScript (NestJS, React, Node.js)

**Style**:
- Use TypeScript strict mode
- Prefer `const` over `let`, avoid `var`
- Use async/await over callbacks
- Use arrow functions for inline callbacks
- Prefer interface over type for object shapes

**File Structure**:
```typescript
// Standard service structure
apps/services/<service-name>/
├── src/
│   ├── config/           # Configuration management
│   ├── controllers/      # HTTP request handlers
│   ├── services/         # Business logic
│   ├── models/           # Data models/entities
│   ├── repositories/     # Data access layer
│   ├── middlewares/      # Express/Fastify middleware
│   ├── utils/            # Helper functions
│   └── main.ts           # Application entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── Dockerfile
```

**Example Controller**:
```typescript
@Controller('/api/v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.userService.findAll(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
```

### Go (Gin Framework)

**Style**:
- Follow standard Go formatting (gofmt)
- Use meaningful variable names
- Handle errors explicitly
- Use interfaces for abstraction
- Keep packages focused

**File Structure**:
```go
// Standard service structure
apps/services/<service-name>/
├── cmd/
│   └── main.go           # Entry point
├── internal/
│   ├── config/
│   ├── handlers/         # HTTP handlers
│   ├── services/         # Business logic
│   ├── models/
│   ├── repositories/
│   └── middleware/
├── pkg/                  # Public packages
└── Dockerfile
```

**Example Handler**:
```go
func (h *UserHandler) GetUsers(c *gin.Context) {
    users, err := h.userService.FindAll(c.Request.Context())
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{
            "success": false,
            "error": err.Error(),
        })
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "data": users,
    })
}
```

### Python (FastAPI)

**Style**:
- Follow PEP 8
- Use type hints
- Use Pydantic for validation
- Async/await for I/O operations

**File Structure**:
```python
# Standard service structure
apps/services/<service-name>/
├── src/
│   ├── config/
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── models/           # Pydantic models
│   ├── repositories/
│   └── main.py
├── tests/
└── Dockerfile
```

**Example Route**:
```python
@router.post("/api/v1/users", response_model=UserResponse)
async def create_user(user: CreateUserRequest, db: Session = Depends(get_db)):
    return await user_service.create(db, user)
```

### Java (Spring Boot)

**Style**:
- Follow Java naming conventions
- Use Spring annotations
- Dependency injection via constructor
- Use Lombok to reduce boilerplate

**File Structure**:
```java
// Standard service structure
apps/services/<service-name>/
├── src/main/java/com/polystack/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── repositories/
│   └── Application.java
├── src/main/resources/
└── Dockerfile
```

### Rust (Actix-web)

**Style**:
- Follow Rust formatting (rustfmt)
- Use Result<T, E> for error handling
- Prefer ownership over cloning when possible
- Use async/await for I/O

**File Structure**:
```rust
// Standard service structure
apps/services/<service-name>/
├── src/
│   ├── config/
│   ├── handlers/
│   ├── services/
│   ├── models/
│   ├── repositories/
│   └── main.rs
├── Cargo.toml
└── Dockerfile
```

---

## API Standards

### REST Endpoint Pattern

```
GET    /api/v1/resources          # List all
GET    /api/v1/resources/:id      # Get one
POST   /api/v1/resources          # Create
PUT    /api/v1/resources/:id      # Update (full replace)
PATCH  /api/v1/resources/:id      # Update (partial)
DELETE /api/v1/resources/:id      # Delete
```

### Required Endpoints (All Services)

```
GET /health       # Health check endpoint
GET /api/docs     # OpenAPI documentation
```

### HTTP Status Codes

- **200 OK**: Successful GET, PUT, PATCH
- **201 Created**: Successful POST
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Invalid request format
- **401 Unauthorized**: Missing/invalid authentication
- **403 Forbidden**: Valid auth but insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation errors
- **500 Internal Server Error**: Server-side error

### Standard Response Format

**Success Response**:
```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

## Authentication & Security

### JWT Authentication

- **Algorithm**: RS256 (asymmetric)
- **Access Token**: 15 minutes expiry
- **Refresh Token**: 7 days expiry
- **Token Rotation**: Refresh tokens rotate on use

### Security Requirements

**All API Services Must Implement**:
- JWT validation middleware
- Rate limiting: 100 req/min per IP
- Input validation on all endpoints
- Parameterized queries (SQL injection prevention)
- Input sanitization (XSS prevention)
- CORS configuration
- HTTPS in production

**Secrets Management**:
- Never commit secrets to repository
- Use `.env` files locally (add to .gitignore)
- Use environment variables
- HashiCorp Vault or cloud secrets manager for production

---

## Database Conventions

### Table Naming
- Lowercase, plural nouns: `users`, `orders`, `payments`
- Junction tables: `user_roles`, `order_items`

### Column Naming
- Lowercase, snake_case: `first_name`, `created_at`, `is_active`
- Primary key: `id` (UUID preferred)
- Foreign keys: `<table>_id` (e.g., `user_id`, `order_id`)

### Standard Columns (All Tables)
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
deleted_at TIMESTAMP NULL  -- For soft deletes
```

### Migrations
- Use framework migration tools (TypeORM, Alembic, Flyway, etc.)
- Never modify existing migrations
- Always test migrations up AND down
- Include rollback strategy

---

## Docker Standards

### Standard Dockerfile Pattern (Node.js Example)

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

### Docker Compose (Local Development)

All infrastructure services run via `tools/local-dev/docker-compose.yml`:
- PostgreSQL: port 5432
- MongoDB: port 27017
- Redis: port 6379
- Kafka + Zookeeper: port 9092
- MinIO: port 9000
- RabbitMQ: port 5672

---

## Observability Standards

### Logging

**Format**: JSON structured logs

```json
{
  "timestamp": "2025-10-13T10:30:00Z",
  "level": "info",
  "service": "api-nest-service",
  "traceId": "abc123",
  "spanId": "def456",
  "message": "User authenticated",
  "context": {
    "userId": "user-123",
    "ip": "192.168.1.1"
  }
}
```

**Log Levels**:
- `error`: Errors requiring immediate attention
- `warn`: Warning conditions
- `info`: Informational messages
- `debug`: Debug information (dev only)

### Metrics (Required)

- Request rate (req/sec)
- Response time (p50, p95, p99)
- Error rate (%)
- CPU usage (%)
- Memory usage (MB)
- Active connections

### Health Check Response

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "kafka": "healthy"
  }
}
```

### Distributed Tracing

- Use OpenTelemetry standard
- Include trace ID in all logs
- Propagate trace context across services
- Send traces to Jaeger

---

## Testing Standards

### Unit Tests

**Structure** (AAA Pattern):
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com' };
      const mockUser = { id: '123', ...userData };
      mockRepository.save.mockResolvedValue(mockUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(mockUser);
      expect(mockRepository.save).toHaveBeenCalledWith(userData);
    });

    it('should throw error when email already exists', async () => {
      // Arrange
      mockRepository.findByEmail.mockResolvedValue({ id: '123' });

      // Act & Assert
      await expect(userService.createUser({ email: 'test@example.com' }))
        .rejects.toThrow('Email already exists');
    });
  });
});
```

**Coverage Target**: 80% minimum for all services

### Integration Tests

- Test database operations with real database (use test containers)
- Test external API calls (mock external services)
- Test message queue interactions
- Test authentication flows

### E2E Tests

- Test critical user flows end-to-end
- Use real browser (Playwright/Cypress)
- Test across different viewports
- Test authentication and authorization

---

## Git Workflow

### Branch Naming Convention

- `feature/<name>` - New features
- `fix/<name>` - Bug fixes
- `docs/<name>` - Documentation updates
- `refactor/<name>` - Code refactoring
- `test/<name>` - Test additions/modifications
- `chore/<name>` - Maintenance tasks

### Commit Convention (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`

**Examples**:
```
feat(api): add user pagination endpoint
fix(auth): resolve token refresh race condition
docs(readme): update installation instructions
test(user-service): add unit tests for validation
chore(deps): update dependencies
```

### Commit Guidelines

- Use present tense: "add feature" not "added feature"
- Use imperative mood: "move cursor to..." not "moves cursor to..."
- Limit first line to 72 characters
- Reference issues/PRs in footer when applicable

---

## Environment Variables

### Standard Pattern

```bash
# Service Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/polystack_dev
MONGODB_URL=mongodb://localhost:27017/polystack
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# External Services
STRIPE_API_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
SENDGRID_API_KEY=SG.xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx

# AWS (Optional)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx

# Observability
SENTRY_DSN=https://xxx@sentry.io/xxx
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

### .env File Management

- Never commit `.env` files
- Always provide `.env.example` with dummy values
- Document all environment variables in README
- Use different `.env` files per environment (dev, staging, prod)

---

## Monolith Architecture

### Purpose

The `apps/monolith/nestjs-monolith/` folder contains a production-ready NestJS monolithic backend that implements **Clean Architecture** + **Domain-Driven Design (DDD)** + **Hexagonal Architecture**. This modular approach allows:

- Clear separation of concerns and business domains
- Easy testability and framework independence
- Future migration to microservices (each domain can become a service)
- Scalability and maintainability

### Architectural Layers

The monolith is organized in vertical slices by domain, with each domain containing all necessary layers:

```
Domain (Bounded Context)
├── domain/                    # Pure business logic (framework-agnostic)
│   ├── entities/              # Core business entities with invariants
│   └── value-objects/         # Immutable value objects (Email, Money, etc)
├── application/               # Use cases and orchestration
│   └── usecases/              # One per business operation (CreateUser, PayOrder, etc)
├── ports/                     # Interfaces defining contracts
│   └── repositories/          # Data access contracts (IUserRepository)
└── adapters/                  # Concrete implementations
    ├── controllers/           # HTTP endpoints (inbound)
    └── repositories/          # Database implementations (outbound)
```

### Layer Responsibilities

**Domain Layer** (`domain/`)
- Core business logic completely independent of frameworks
- Entities with business invariants (rules that must be enforced)
- Immutable Value Objects (Email, Money, Address, etc)
- Domain Exceptions for business rule violations
- No async/await, no database code, no HTTP concerns

**Application Layer** (`application/`)
- Use cases orchestrating domain logic
- Input/Output DTOs for each operation
- Result<T> pattern for error handling
- Depends on domain and repository ports, not implementations

**Ports** (`ports/`)
- Interfaces defining contracts between layers
- Inbound ports: Use case interfaces
- Outbound ports: Repository, event bus, external API contracts
- Enable dependency inversion and testability

**Adapters** (`adapters/`)
- HTTP Controllers (inbound adapters)
- Repository implementations (outbound adapters)
- External API clients
- Only layer that knows about frameworks and technologies

**Shared/Infrastructure** (`shared/`)
- Base classes (BaseEntity, BaseValueObject)
- Common exceptions and utility types
- Global HTTP filters and middleware
- Database, cache, event bus implementations
- Cross-domain concerns

### Folder Structure

```
apps/monolith/nestjs-monolith/src/
├── domains/                           # Business domains
│   ├── user/                          # User domain (example - fully implemented)
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   └── value-objects/
│   │   │       └── email.value-object.ts
│   │   ├── application/
│   │   │   └── usecases/
│   │   │       ├── create-user.usecase.ts
│   │   │       └── get-user.usecase.ts
│   │   ├── ports/
│   │   │   └── repositories/
│   │   │       └── user.repository.port.ts
│   │   ├── adapters/
│   │   │   ├── controllers/
│   │   │   │   └── user.controller.ts
│   │   │   └── repositories/
│   │   │       └── in-memory-user.repository.ts
│   │   └── user.module.ts
│   ├── payment/                       # Payment domain (template)
│   ├── order/                         # Order domain (template)
│   ├── notification/                  # Notification domain (template)
│   └── product/                       # Product domain (template)
├── shared/
│   ├── kernel/
│   │   ├── entities/
│   │   │   └── base.entity.ts
│   │   ├── value-objects/
│   │   │   └── base.value-object.ts
│   │   ├── exceptions/
│   │   │   └── domain.exception.ts    # All domain exceptions
│   │   └── interfaces/
│   │       └── result.interface.ts    # Result<T> pattern
│   ├── infrastructure/
│   │   ├── database/                  # TypeORM setup (future)
│   │   ├── cache/                     # Redis (future)
│   │   ├── event-bus/                 # Event publishing
│   │   ├── external-apis/             # Third-party integrations
│   │   └── http/
│   │       ├── controllers/
│   │       │   └── health.controller.ts
│   │       └── filters/
│   │           └── domain-exception.filter.ts
│   └── shared.module.ts
├── config/                            # Application config
├── app.module.ts                      # Root NestJS module
└── main.ts                            # Bootstrap

apps/monolith/nestjs-monolith-e2e/     # E2E tests
```

### Data Flow (Hexagonal Architecture)

```
HTTP Request
    ↓
Controller (Inbound Adapter)
    ↓
Use Case (Application Layer)
    ↓
Domain Entity (Domain Layer - Business Logic)
    ↓
Repository Port Interface
    ↓
Repository Implementation (Outbound Adapter)
    ↓
Database / Cache / External API
    ↓
Response back through layers
    ↓
HTTP Response
```

### Naming Convention for Monolith

- `<domain>-<operation>.usecase.ts` - Use cases
- `<entity>.entity.ts` - Domain entities
- `<concept>.value-object.ts` - Value objects
- `I<entity>Repository` - Repository interfaces
- `<entity>.controller.ts` - HTTP controllers
- `<database>-<entity>.repository.ts` - Repository implementations

**Examples**:
- `create-user.usecase.ts`
- `user.entity.ts`
- `email.value-object.ts`
- `IUserRepository`
- `user.controller.ts`
- `postgres-user.repository.ts`

### Adding New Domains

Each domain follows the same pattern as the User domain. Follow these steps:

1. **Create domain structure**:
   ```bash
   mkdir -p src/domains/payment/{domain,application,ports,adapters}
   ```

2. **Implement domain layer first** (entities, value objects, exceptions)
   - Define boundaries and business rules

3. **Define ports** (repository interfaces)
   - What the domain needs from outside

4. **Implement application layer** (use cases)
   - Orchestrate domain logic

5. **Create adapters** (controllers, repositories)
   - Connect to HTTP and external systems

6. **Create NestJS module**
   - Wire up dependency injection

7. **Register in app.module.ts**
   - Import the new domain module

See `apps/monolith/nestjs-monolith/README.md` for complete examples.

### Key Technologies

- **Framework**: NestJS (TypeScript)
- **Testing**: Jest, Supertest
- **Current DB**: In-Memory (development)
- **Future DB**: PostgreSQL with TypeORM
- **Pattern**: Clean Architecture + DDD + Hexagonal

### Quality Gates for Monolith

- ✅ All layers properly separated (no framework in domain)
- ✅ Repository implementations can be swapped
- ✅ Use cases testable without HTTP layer
- ✅ Domain logic testable without database
- ✅ 80% code coverage minimum
- ✅ All business rules enforced in entities
- ✅ No circular dependencies

---

## File Organization

### Backend Service Files

**Where to place**:
- **Controllers/Handlers**: `src/controllers/` - HTTP request handling
- **Business Logic**: `src/services/` - Core business logic
- **Data Access**: `src/repositories/` - Database queries
- **Models/Entities**: `src/models/` - Data structures
- **Middleware**: `src/middlewares/` - Request interceptors
- **Configuration**: `src/config/` - App configuration
- **Utilities**: `src/utils/` - Helper functions
- **Types**: `src/types/` - TypeScript type definitions
- **Tests**: `tests/` - All test files

### Frontend Application Files

**Where to place**:
- **Components**: `src/components/` - Reusable UI components
- **Pages**: `src/pages/` - Page-level components
- **Layouts**: `src/layouts/` - Layout components
- **Services**: `src/services/` - API clients, external services
- **Hooks**: `src/hooks/` - Custom React hooks
- **Store**: `src/store/` - State management (Redux, Zustand, etc.)
- **Utils**: `src/utils/` - Helper functions
- **Types**: `src/types/` - TypeScript type definitions
- **Assets**: `src/assets/` - Images, fonts, static files
- **Styles**: `src/styles/` - Global styles, theme

### Shared Libraries

**Where to place**:
- **Common utilities**: `libs/shared/src/lib/utils/`
- **Type definitions**: `libs/shared/src/lib/types/`
- **API contracts**: `libs/shared/src/lib/contracts/`
- **HTTP clients**: `libs/shared/src/lib/http/`
- **Auth utilities**: `libs/shared/src/lib/auth/`
- **UI components**: `libs/ui-components/src/lib/`
- **Validation schemas**: `libs/shared/src/lib/validation/`

### Documentation

**Where to place**:
- **API specs**: `docs/api-contracts/<service-name>.yaml`
- **Architecture docs**: `docs/architecture/`
- **ADRs**: `docs/architecture/decisions/`
- **Runbooks**: `docs/runbooks/`
- **Service READMEs**: `apps/<category>/<service-name>/README.md`

---

## Important Principles

### 1. **Local-First Development**
- All services must run locally via Docker Compose
- Minimize cloud costs during development
- Only deploy to cloud for IaC and CI/CD phases

### 2. **Start Simple, Expand Gradually**
- Build ONE implementation of each service type first
- Prove patterns work before adding more languages
- For example: Build `auth-nodejs-service` before `auth-golang-service`

### 3. **Quality Over Speed**
- Never skip tests to "move faster"
- All quality gates must pass before moving to next phase
- 80% test coverage is a requirement, not a suggestion

### 4. **Documentation is Code**
- Update `docs/PROGRESS.md` after each completed step
- Write README for each service as you build it
- Generate OpenAPI specs for all APIs
- Document design decisions in ADRs

### 5. **Consistency Across Languages**
- Same directory structure patterns regardless of language
- Same API response formats
- Same logging format (JSON)
- Same health check format
- Same authentication mechanism (JWT)

### 6. **Security First**
- Never commit secrets
- Validate all inputs
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines

### 7. **Cloud-Agnostic Design**
- Use standard protocols (HTTP, gRPC, AMQP)
- Avoid cloud-specific services in application code
- Abstract cloud services behind interfaces
- Use Terraform for infrastructure

### 8. **Observability Built-In**
- Structured logging from day one
- Health checks on all services
- Metrics collection
- Distributed tracing
- Never deploy without observability

### 9. **Containerize Everything**
- Every service gets a Dockerfile
- Test Docker builds regularly
- Keep images small (use alpine, multi-stage builds)
- Include health checks in Dockerfile

### 10. **Automation First**
- Automate testing, building, deployment
- Use Nx for monorepo management
- Create generators for common patterns
- CI/CD from early phases

---

## Common Nx Commands

```bash
# Development
nx serve <project-name>                    # Start dev server
nx serve api-nest-service --port=3100      # Serve with custom port

# Building
nx build <project-name>                    # Build project
nx build --configuration=production        # Production build
nx run-many --target=build --all          # Build all projects
nx run-many --target=build --projects=api-*  # Build all api services

# Testing
nx test <project-name>                     # Run unit tests
nx test <project-name> --coverage          # Run with coverage
nx run-many --target=test --all           # Test all projects
nx e2e <project-name>-e2e                  # Run E2E tests

# Linting
nx lint <project-name>                     # Lint project
nx run-many --target=lint --all           # Lint all projects

# Utilities
nx graph                                   # View dependency graph
nx affected:test                           # Test affected by changes
nx affected:build                          # Build affected by changes
nx list                                    # List installed plugins
nx generate                                # Generate code

# Workspace
nx reset                                   # Clear Nx cache
nx workspace-generator                     # Create custom generator
```

---

## Progress Tracking

**Current Status**: 0/16 phases complete

**Active Phase**: None - Ready to start Phase 1

**Progress Document**: `docs/PROGRESS.md`

**Update Frequency**: After completing each step or phase

**Notation**:
- `[ ]` Not started
- `[~]` In progress
- `[✓]` Completed

---

## Quick Reference Links

- **Implementation Plan**: `docs/implementation-plan.md`
- **Progress Tracker**: `docs/PROGRESS.md`
- **Technical Spec**: `docs/initial-idea.md`
- **Architecture Docs**: `docs/architecture/`
- **API Contracts**: `docs/api-contracts/`

---

## Next Steps

**To Begin Implementation**:
1. Start with **Phase 1: Core Foundation & Nx Monorepo Setup**
2. Follow the steps in `docs/implementation-plan.md`
3. Update `docs/PROGRESS.md` as you complete each step
4. Ensure all quality gates pass before moving to next phase
5. Commit frequently with conventional commit messages

**First Task**: Initialize Nx workspace with appropriate presets

---

*This document should be treated as the source of truth for implementation standards and patterns. Update as new patterns emerge during development.*
