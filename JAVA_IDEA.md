# Technologies & Concepts

This document provides an overview of the technologies and architectural concepts implemented in the FC3 Admin Video Catalog project.

---

## Technologies

### Core Framework & Language

| Technology | Version | Description |
|------------|---------|-------------|
| Java | 17 | Target runtime language |
| Spring Boot | 2.7.7 | Application framework |
| Gradle | 7.6.1 | Build automation tool |

### Data Access & Storage

| Technology | Version | Description |
|------------|---------|-------------|
| MySQL | 8 | Primary relational database |
| Hibernate/JPA | - | Object-relational mapping |
| H2 Database | - | In-memory testing database |
| HikariCP | - | JDBC connection pooling |
| Flyway | 9.11.0 | Database migration management |
| Google Cloud Storage | - | Cloud object storage for video files |

### Web & API

| Technology | Version | Description |
|------------|---------|-------------|
| Undertow | - | Embedded application server |
| SpringDoc OpenAPI | 1.6.14 | OpenAPI/Swagger documentation |
| Jackson | - | JSON serialization/deserialization |

### Security & Authentication

| Technology | Version | Description |
|------------|---------|-------------|
| Spring Security | - | Authentication and authorization |
| OAuth2 Resource Server | - | JWT token validation |
| Keycloak | 20.0.3 | Identity provider and access management |
| JWT | - | Token-based authentication |

### Messaging & Events

| Technology | Version | Description |
|------------|---------|-------------|
| RabbitMQ | 3 | Message broker (AMQP) |
| Spring AMQP | - | AMQP client library |

### Observability & Monitoring

| Technology | Version | Description |
|------------|---------|-------------|
| Elasticsearch | 7.17.9 | Log aggregation and search |
| Kibana | 7.17.9 | Log visualization |
| Logstash | 7.17.9 | Log processing pipelines |
| Filebeat | 7.17.9 | Log shipping to ELK stack |
| JaCoCo | - | Code coverage analysis |

### Testing

| Technology | Version | Description |
|------------|---------|-------------|
| JUnit 5 (Jupiter) | - | Testing framework |
| Mockito | 5.0.0 | Mocking framework |
| TestContainers | 1.17.6 | Docker containers for integration tests |
| JavaFaker | 1.0.2 | Test data generation |

### Containerization & CI/CD

| Technology | Description |
|------------|-------------|
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| GitHub Actions | CI/CD pipelines |

### Utilities

| Technology | Version | Description |
|------------|---------|-------------|
| Vavr | 0.10.4 | Functional programming library |
| Guava | 31.1-jre | Utility library |

---

## Architectural Concepts & Patterns

### Domain-Driven Design (DDD)

- **Aggregates**: Category, Video, Genre, CastMember - each with root entities
- **Entities**: Domain objects with identity (`Entity<ID>` base class)
- **Value Objects**: Immutable domain objects (`ValueObject` base class)
- **Aggregate IDs**: Strongly typed identifiers (CategoryID, VideoID, etc.)
- **Domain Events**: Event-based notifications (`DomainEvent` interface)
- **Domain Gateways**: Abstraction layer for persistence
- **Ubiquitous Language**: Domain-specific model throughout codebase

### Clean Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Infrastructure                        │
│  (Controllers, Persistence, External Services, Web)      │
│  ┌─────────────────────────────────────────────────┐    │
│  │                  Application                     │    │
│  │            (Use Cases, Orchestration)            │    │
│  │  ┌─────────────────────────────────────────┐    │    │
│  │  │                Domain                    │    │    │
│  │  │         (Core Business Logic)            │    │    │
│  │  └─────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

- **Domain Layer**: Pure business logic (domain module)
- **Application Layer**: Use cases and orchestration (application module)
- **Infrastructure Layer**: Persistence, external services, controllers (infrastructure module)
- **Dependency Rule**: Dependencies always point inward toward domain

### Test-Driven Development (TDD)

- **Test Categories**:
  - `@UnitTest` - Unit tests
  - `@IntegrationTest` - Integration tests
  - `@E2ETest` - End-to-end tests
- **Test Organization**: Parallel test structure matching source structure
- **TestContainers**: Integration testing with real databases

### Hexagonal Architecture (Ports & Adapters)

**Ports (Interfaces)**:
- `CategoryGateway`, `VideoGateway`, `GenreGateway`, `CastMemberGateway`
- `MediaResourceGateway`
- `StorageService`
- `EventService`

**Adapters (Implementations)**:
- MySQL adapters (`CategoryMySQLGateway`, `VideoMySQLGateway`)
- Google Cloud Storage adapter (`GCStorageService`)
- RabbitMQ adapter (`RabbitEventService`)
- Local test adapters (`InMemoryStorageService`, `InMemoryEventService`)

### Use Case Pattern

- `UseCase<IN, OUT>` - Base abstract class for application use cases
- `NullaryUseCase<OUT>` - For operations with no parameters
- Segregated use cases per operation:
  - `CreateCategoryUseCase`
  - `UpdateCategoryUseCase`
  - `GetCategoryByIdUseCase`
  - `ListCategoriesUseCase`
  - `DeleteCategoryUseCase`

### CQRS (Command Query Responsibility Segregation) - Partial

- **Commands**: `CreateCategoryCommand`, `UpdateCategoryCommand`, etc.
- **Queries**: Separate query methods with `SearchQuery`
- **Output DTOs**: Distinct output objects (`CategoryOutput`, `CategoryListOutput`)

### Event-Driven Architecture

- **Domain Events**: `VideoMediaCreated` event
- **Event Publishing**: Domain events registered and published
- **AMQP Queues**: `video.created.queue`, `video.encoded.queue`
- **Event Listeners**: `VideoEncoderListener` for consuming events

---

## Infrastructure & Deployment

### Project Structure

```
fc3-admin-catalogo-de-videos-java/
├── domain/                    # Pure business logic (DDD)
├── application/               # Use cases and application services
├── infrastructure/            # Spring Boot app, controllers, persistence
├── buildSrc/                  # Gradle plugin conventions
├── sandbox/                   # Docker Compose configurations
│   ├── app/                   # Application container
│   ├── elk/                   # ELK Stack (observability)
│   └── services/              # MySQL, RabbitMQ, Keycloak
└── .github/workflows/         # CI/CD pipelines
```

### Application Profiles

| Profile | Description |
|---------|-------------|
| `development` | Disabled security, local Keycloak |
| `test-integration` | H2 database, excluded RabbitMQ |
| `test-e2e` | TestContainers setup |
| `sandbox` | Google Cloud, RabbitMQ |
| `production` | Environment variables for secrets |

### Security & Access Control

- **Authentication**: OAuth2 JWT validation via Keycloak
- **Session Management**: Stateless
- **Roles**:
  - `CATALOGO_ADMIN`
  - `CATALOGO_CAST_MEMBERS`
  - `CATALOGO_CATEGORIES`
  - `CATALOGO_GENRES`
  - `CATALOGO_VIDEOS`

### CI/CD Pipelines

- `ci.yml` - CI pipeline for feature/bugfix branches (runs tests)
- `ci-cd.yml` - Full CI/CD pipeline for main/master/develop/hotfix/release
  - Test execution
  - Build artifact generation
  - Docker image build and push to Docker Hub

### Performance Optimizations

- **Undertow**: 64 worker threads, 4 IO threads
- **HikariCP**: Max 20 connections, min idle 10
- **Hibernate**: `open-in-view: false`, disabled autocommit
- **Response Compression**: Enabled for responses > 1KB
- **File Upload Limits**: 10GB max file size

---

## Database Migrations

Flyway manages database schema versions:

| Version | Description |
|---------|-------------|
| V1 | Initial schema - Category aggregate |
| V2 | Genre aggregate |
| V3 | CastMember aggregate |
| V4 | Video aggregate |

---

## Key Architectural Decisions

1. **Explicit Use Case Classes**: Separate class per operation rather than generic handlers
2. **Gateway Pattern**: All persistence behind interfaces to enable multiple implementations
3. **Domain Events in Entities**: Domain-driven events for cross-aggregate communication
4. **JWT-based Stateless Auth**: OAuth2 with Keycloak for security
5. **AMQP for Async Processing**: RabbitMQ for video encoding events
6. **Cloud Storage Abstraction**: Interface-based storage service supporting multiple implementations
7. **Profile-based Configuration**: Environment-specific behavior without code changes
