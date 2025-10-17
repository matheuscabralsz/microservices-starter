# PolyStack - AI Reference Documentation

## Overview

PolyStack is an Nx monorepo for polyglot microservices on AWS. This document provides technical specifications for code generation and development.

## Core Principles

- **Nx Monorepo**: All projects in single repository
- **Cloud-Agnostic**: Terraform for AWS/Azure/GCP
- **Polyglot**: Multiple language implementations per service type
- **Micro-Frontends**: Module federation for web apps
- **Container-First**: Docker for all services

---

## Naming Convention

**Pattern**: `<purpose>-<languageorframework>-<category>`

**Categories**:
- `web` - Frontend applications
- `app` - Mobile applications
- `service` - Backend microservices

**Purposes**:
- `worker` - Background processors
- `gateway` - API gateways
- `auth` - Authentication services
- `payment` - Payment gateways
- `admin` - Admin dashboards

**Language or Framework**:
- `react` - React
- `angular` - Angular
- `vue` - Vue
- `nestjs` - NestJS
- `spring` - Spring Boot
- `golang` - Gin
- `fastapi` - FastAPI
- `rust` - Actix-web
- `python` - Python:

**Examples**:
- `api-nest-service`
- `dashboard-vue-web`
- `worker-rust-service`

---

## Directory Structure

```
polystack/
├── apps/
│   ├── web/                  # Frontend apps
│   ├── mobile/               # Mobile apps
│   └── services/             # Backend services
├── libs/
│   ├── shared/               # Shared code
│   └── ui-components/        # UI library
├── infrastructure/
│   ├── terraform/            # IaC
│   ├── kubernetes/           # K8s manifests
│   └── docker/               # Dockerfiles
├── docs/
│   ├── api-contracts/        # OpenAPI specs
│   └── architecture/         # ADRs
└── tools/
    ├── generators/           # Code generators
    └── local-dev/            # Docker Compose
```

---

## Technology Stack Reference

### Web Applications (Micro-Frontends)

| Name                  | Framework        | Port | Purpose                     |
|-----------------------|------------------|------|-----------------------------|
| `shell-react-web`     | React (Latest)   | 3000 | Module federation host      |
| `auth-vue-web`        | Vue (Latest)     | 3001 | Auth flows (login/register) |
| `checkout-svelte-web` | Svelte (Latest)  | 3002 | Payment checkout            |
| `api-angular-web`     | Angular (Latest) | 8000 | API consumer                |
| `shared-playbook`     | Multi            | N/A  | Design system library       |

### Mobile Applications

| Name                   | Framework | Platforms |
|------------------------|-----------|-----------|
| `complete-flutter-app` | Flutter | iOS, Android, Web |
| `api-react-native-app` | React Native | iOS, Android |
| `api-ionic-app`        | Ionic + Angular | iOS, Android, Web |
| `auth-ionic-app`       | Ionic + Angular | iOS, Android, Web |

### API Services (RESTful)

| Name | Language               | Framework | Port |
|------|------------------------|-----------|------|
| `api-nest-service` | TypeScript             | NestJS | 3100 |
| `api-spring-service` | Java (Latest)                  | Spring Boot | 8081 |
| `api-golang-service` | Go (Latest)            | Gin | 8082 |
| `api-fastapi-service` | Python (Latest)        | FastAPI | 8083 |
| `api-rust-service` | Rust                   | Actix-web | 8084 |

**Required Endpoints**:
- `GET /health` - Health check
- `GET /api/docs` - OpenAPI documentation
- JWT authentication middleware
- Request validation
- Error handling middleware

### Authentication Services

| Name | Technology | Port |
|------|-----------|------|
| `auth-nodejs-service` | Node.js + Fastify | 3200 |
| `auth-golang-service` | Go + JWT | 8200 |
| `auth-keycloak-service` | Keycloak | 8080 |

**Features**: OAuth 2.0, OIDC, MFA, RBAC, social login

### Payment Services

| Name | Technology | Port |
|------|-----------|------|
| `payment-golang-service` | Go | 3300 |
| `payment-stripe-service` | Node.js | 3301 |
| `payment-adapter-service` | TypeScript | 3302 |

**Supported Gateways**: Stripe, PayPal, Mercado Pago, Square, Braintree

### Messaging Services

| Name | Technology | Port |
|------|-----------|------|
| `messaging-kafka-service` | Kafka | 9092 |
| `messaging-rabbitmq-service` | RabbitMQ | 5672 |
| `notification-nodejs-service` | Node.js | 3400 |

**Notification Channels**: Email (SendGrid/SES), SMS (Twilio), Push (Firebase)

### Data Services

| Name | Technology | Port |
|------|-----------|------|
| `analytics-python-service` | Python + Pandas | 5000 |
| `reporting-nodejs-service` | Node.js | 3500 |
| `etl-airflow-service` | Airflow | 8080 |

### Worker Services

| Name | Technology | Queue |
|------|-----------|-------|
| `worker-nodejs-service` | Node.js + Bull | Redis |
| `worker-python-service` | Python + Celery | RabbitMQ |
| `worker-rust-service` | Rust | Custom |

### Infrastructure Services

| Name | Technology | Port |
|------|-----------|------|
| `gateway-kong-service` | Kong | 8000 |
| `gateway-nginx-service` | Nginx | 80/443 |
| `observability-prometheus` | Prometheus | 9090 |
| `observability-grafana` | Grafana | 3000 |
| `logging-elk-service` | ELK Stack | 5601 |
| `tracing-jaeger-service` | Jaeger | 16686 |

### Storage Services

| Name | Technology | Port |
|------|-----------|------|
| `storage-minio-service` | MinIO | 9000 |
| `cache-redis-service` | Redis | 6379 |

---

## Standard Service Structure

### Backend Service Template

```
<service-name>/
├── src/
│   ├── config/           # Configuration
│   ├── controllers/      # HTTP handlers
│   ├── services/         # Business logic
│   ├── models/           # Data models
│   ├── repositories/     # Data access
│   ├── middlewares/      # Express/Fastify middleware
│   ├── utils/            # Utilities
│   └── main.ts           # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── openapi.yaml          # API specification
├── package.json          # or equivalent
└── README.md
```

### Web Application Template

```
<app-name>/
├── src/
│   ├── app/              # Main app code
│   ├── components/       # React/Vue/Angular components
│   ├── pages/            # Page components
│   ├── services/         # API clients
│   ├── hooks/            # Custom hooks (React)
│   ├── store/            # State management
│   ├── assets/           # Static assets
│   └── styles/           # Global styles
├── public/
├── tests/
├── webpack.config.js     # or equivalent
└── package.json
```

---

## Docker Configuration

### Standard Dockerfile Template

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
CMD ["node", "dist/main.js"]
```

### Docker Compose (Local Development)

All infrastructure services run via `tools/local-dev/docker-compose.yml`:
- PostgreSQL: 5432
- MongoDB: 27017
- Redis: 6379
- Kafka: 9092
- MinIO: 9000

---

## API Standards

### REST Endpoints Pattern

```
GET    /api/v1/resources          # List
GET    /api/v1/resources/:id      # Get one
POST   /api/v1/resources          # Create
PUT    /api/v1/resources/:id      # Update (full)
PATCH  /api/v1/resources/:id      # Update (partial)
DELETE /api/v1/resources/:id      # Delete
```

### HTTP Status Codes

- 200: OK
- 201: Created
- 204: No Content
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

### Response Format

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

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": []
  }
}
```

---

## Environment Variables Pattern

```bash
# Service Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# External Services
STRIPE_API_KEY=sk_test_xxx
SENDGRID_API_KEY=SG.xxx

# Observability
SENTRY_DSN=https://xxx
LOG_LEVEL=debug
```

---

## Testing Standards

### Unit Tests

```typescript
// Example structure
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com' };
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });
  });
});
```

**Coverage Target**: 80%

### Integration Tests

Test database operations, external API calls, message queue interactions.

### E2E Tests

Test critical user flows through the entire system.

---

## Infrastructure as Code

### Terraform Module Pattern

```
infrastructure/terraform/modules/<module-name>/
├── main.tf           # Main resources
├── variables.tf      # Input variables
├── outputs.tf        # Output values
├── versions.tf       # Provider versions
└── README.md         # Module documentation
```

### Kubernetes Manifests Pattern

```
infrastructure/kubernetes/
├── base/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    ├── staging/
    └── production/
```

---

## Code Generation Commands

```bash
# Generate API service
nx generate @polystack/generators:service \
  --name=users \
  --language=typescript \
  --framework=nestjs

# Generate web app
nx generate @polystack/generators:web-app \
  --name=settings \
  --framework=react

# Generate shared library
nx generate @polystack/generators:library \
  --name=utils \
  --type=shared
```

---

## Common Commands

```bash
# Development
nx serve <project-name>
nx serve api-nest-service --port=3100

# Build
nx build <project-name>
nx build --configuration=production

# Test
nx test <project-name>
nx test --coverage

# Lint
nx lint <project-name>

# Run multiple
nx run-many --target=build --all
nx run-many --target=test --projects=api-*

# Dependency graph
nx graph
```

---

## Observability Standards

### Logging Format (JSON)

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

### Required Metrics

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

---

## Security Requirements

### Authentication
- JWT with RS256 algorithm
- Refresh token rotation
- Token expiry: Access (15min), Refresh (7d)

### API Security
- Rate limiting: 100 req/min per IP
- Input validation on all endpoints
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize inputs)
- CORS configuration

### Secrets Management
- Never commit secrets to repository
- Use environment variables
- HashiCorp Vault or AWS Secrets Manager for production

### Dependencies
- Automated security scanning (Snyk/Dependabot)
- Regular updates
- Vulnerability monitoring

---

## Git Workflow

### Branch Naming
- `feature/<name>` - New features
- `fix/<name>` - Bug fixes
- `docs/<name>` - Documentation
- `refactor/<name>` - Code refactoring
- `test/<name>` - Test additions

### Commit Convention
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Examples**:
```
feat(api): add user pagination endpoint
fix(auth): resolve token refresh race condition
docs(readme): update installation instructions
```

---

## CI/CD Pipeline Stages

1. **Lint & Format** - ESLint, Prettier
2. **Unit Tests** - Jest, coverage report
3. **Build** - Compile/bundle all projects
4. **Integration Tests** - Database, API tests
5. **Security Scan** - Dependency check, container scan
6. **E2E Tests** - Critical user flows
7. **Build Images** - Docker images
8. **Push to Registry** - ECR, Docker Hub
9. **Deploy** - K8s/ECS deployment
10. **Smoke Tests** - Verify deployment

---

## Database Schema Conventions

### Table Naming
- Lowercase, plural: `users`, `orders`, `payments`
- Junction tables: `user_roles`, `order_items`

### Column Naming
- Lowercase, snake_case: `first_name`, `created_at`
- Primary key: `id` (UUID or BigInt)
- Foreign keys: `<table>_id` (e.g., `user_id`)

### Standard Columns
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
deleted_at TIMESTAMP NULL  -- Soft delete
```

---

## This Document

**Purpose**: Technical reference for AI-assisted development
**Usage**: Code generation, architecture decisions, standards enforcement
**Maintenance**: Update when adding new services or changing conventions