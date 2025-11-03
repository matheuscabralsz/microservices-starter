# PolyStack NestJS Monolith Backend

A production-ready NestJS monolithic backend implementing **Clean Architecture**, **Domain-Driven Design (DDD)**, and **Hexagonal Architecture** principles.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    HTTP Requests (Port 3000)                │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Controllers    │  Inbound Adapters
                    │  (User, Payment) │  (Hexagonal)
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Use Cases      │  Application Layer
                    │  (Business Logic)│  (Orchestration)
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   Entities       │  Domain Layer
                    │  (Core Business) │  (Framework-agnostic)
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
      ┌─────▼────┐    ┌─────▼────┐    ┌─────▼────┐
      │Repositories│  │Event Bus  │   │External  │  Outbound Adapters
      │(Database)  │  │(Events)   │   │APIs      │  (Hexagonal)
      └────────────┘  └───────────┘   └──────────┘
```

## Folder Structure

```
src/
├── domains/                          # Business domains (DDD)
│   ├── user/                         # User domain example
│   │   ├── domain/                   # Core business logic
│   │   │   ├── entities/             # User entity (immutable)
│   │   │   └── value-objects/        # Email, etc (immutable)
│   │   ├── application/              # Use cases
│   │   │   └── usecases/             # CreateUser, GetUser, etc
│   │   ├── ports/                    # Interfaces (contracts)
│   │   │   └── repositories/         # IUserRepository
│   │   ├── adapters/                 # Implementations
│   │   │   ├── controllers/          # HTTP endpoints
│   │   │   └── repositories/         # Database implementations
│   │   └── user.module.ts            # NestJS module
│   ├── payment/                      # Template - implement similarly
│   ├── order/                        # Template - implement similarly
│   ├── notification/                 # Template - implement similarly
│   └── product/                      # Template - implement similarly
│
├── shared/                           # Cross-domain concerns
│   ├── kernel/                       # Base classes & interfaces
│   │   ├── entities/                 # BaseEntity class
│   │   ├── value-objects/            # BaseValueObject class
│   │   ├── exceptions/               # Domain exceptions
│   │   └── interfaces/               # Result<T>, PaginatedResult
│   ├── infrastructure/               # Technical implementations
│   │   ├── database/                 # ORM setup (TypeORM, etc)
│   │   ├── cache/                    # Redis, etc
│   │   ├── event-bus/                # Event publishing
│   │   ├── external-apis/            # Third-party services
│   │   └── http/                     # Global HTTP setup
│   │       ├── controllers/          # Health, docs, etc
│   │       └── filters/              # Exception filters
│   └── shared.module.ts
│
├── config/                           # Application configuration
├── app.module.ts                     # Root module
└── main.ts                           # Bootstrap
```

## Core Concepts

### 1. Clean Architecture
- **Independence**: Domain logic is independent of frameworks, databases, and HTTP
- **Testability**: Business logic can be tested without frameworks
- **Flexibility**: Easy to swap implementations (e.g., change database)

### 2. Domain-Driven Design (DDD)
- **Domains**: Each domain is a bounded context with its own model
- **Entities**: Objects with identity that change over time
- **Value Objects**: Immutable objects compared by value (Email, Money, etc)
- **Use Cases**: Application business rules orchestrated by services
- **Repositories**: Abstractions for data access

### 3. Hexagonal Architecture (Ports & Adapters)
- **Inbound Adapters**: Controllers receive HTTP requests
- **Outbound Adapters**: Repositories, external APIs
- **Ports**: Interfaces defining contracts between layers
- **Core**: Domain logic isolated from all adapters

## Layers Explained

### 📘 Domain Layer (Core Business)
- **Location**: `domains/*/domain/`
- **Responsibility**: Pure business logic, framework-agnostic
- **Contains**: Entities, Value Objects, Domain Services
- **Never depends on**: Use cases, adapters, or external frameworks
- **Example**: `User entity with email validation`

```typescript
// Domain layer - NO NestJS decorators, NO database code
export class User extends BaseEntity<string> {
  private constructor(id, email, firstName, lastName) { }

  public static create(id, email, firstName, lastName): User {
    // Business rules enforcement
    if (!firstName) throw new BusinessRuleException('Name required');
    return new User(id, email, firstName, lastName);
  }

  public updateEmail(email: Email): void {
    // Business logic - email is a value object
    this._email = email;
    this.updateTimestamp();
  }
}
```

### 🎯 Application Layer (Use Cases)
- **Location**: `domains/*/application/`
- **Responsibility**: Orchestration of business logic
- **Contains**: Use cases (one per business operation)
- **Depends on**: Domain layer, Repositories (via ports)
- **Example**: `CreateUserUseCase orchestrates User creation`

```typescript
// Application layer - Orchestration
@Injectable()
export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: CreateUserInput): Promise<Result<CreateUserOutput>> {
    // Check business rule
    if (await this.userRepository.existsByEmail(input.email)) {
      return Result.fail(new ConflictException('Email exists'));
    }

    // Create domain entity
    const user = User.create(uuidv4(), new Email(input.email), ...);

    // Persist
    await this.userRepository.save(user);

    return Result.ok(/* output */);
  }
}
```

### 🔌 Ports (Interfaces)
- **Location**: `domains/*/ports/`
- **Responsibility**: Define contracts for external dependencies
- **Types**:
  - **Inbound Ports**: Use case interfaces
  - **Outbound Ports**: Repository, event bus, external API interfaces
- **Example**: `IUserRepository` interface

```typescript
// Port - Contract between domain and adapters
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
}
```

### 🔧 Adapters (Implementations)
- **Location**: `domains/*/adapters/`
- **Responsibility**: Implement ports and handle HTTP/Database concerns
- **Types**:
  - **Inbound Adapters**: Controllers handle HTTP
  - **Outbound Adapters**: Repositories handle database, external APIs
- **Example**: `UserController` and `InMemoryUserRepository`

```typescript
// Inbound Adapter (Controller)
@Controller('api/v1/users')
export class UserController {
  constructor(private createUserUseCase: CreateUserUseCase) {}

  @Post()
  async create(@Body() dto: CreateUserRequestDto) {
    const result = await this.createUserUseCase.execute(dto);
    return result.fold(/* error handler */, /* success handler */);
  }
}

// Outbound Adapter (Repository)
@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }
}
```

## Getting Started

### Prerequisites
```bash
Node.js 18+
npm 9+
```

### Installation
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Running
```bash
# Development mode
npm start

# Watch mode
npm run start:dev

# Production build
npm run build
npm start:prod
```

### Testing
```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## Available Endpoints

### Health Check
```
GET /health
GET /health/ready  (Kubernetes readiness)
GET /health/live   (Kubernetes liveness)
```

### User Domain
```
POST   /api/v1/users              # Create user
GET    /api/v1/users/:id          # Get user
GET    /api/v1/users              # List users (with pagination)
PUT    /api/v1/users/:id          # Update user
DELETE /api/v1/users/:id          # Delete user
```

## Adding a New Domain

### 1. Create Domain Structure
```bash
mkdir -p src/domains/payment/{domain,application,ports,adapters}
```

### 2. Create Domain Layer
```typescript
// src/domains/payment/domain/entities/payment.entity.ts
export class Payment extends BaseEntity<string> {
  // Implement using User as reference
}
```

### 3. Create Application Layer
```typescript
// src/domains/payment/application/usecases/process-payment.usecase.ts
@Injectable()
export class ProcessPaymentUseCase {
  constructor(private paymentRepository: IPaymentRepository) {}
  async execute(input): Promise<Result<Output>> { }
}
```

### 4. Create Ports
```typescript
// src/domains/payment/ports/repositories/payment.repository.port.ts
export interface IPaymentRepository {
  save(payment: Payment): Promise<void>;
  // ... other methods
}
```

### 5. Create Adapters
```typescript
// src/domains/payment/adapters/controllers/payment.controller.ts
@Controller('api/v1/payments')
export class PaymentController {
  // Implement using UserController as reference
}

// src/domains/payment/adapters/repositories/payment.repository.ts
@Injectable()
export class PaymentRepository implements IPaymentRepository {
  // Implement repository
}
```

### 6. Create Module
```typescript
// src/domains/payment/payment.module.ts
@Module({
  providers: [
    ProcessPaymentUseCase,
    { provide: PAYMENT_REPOSITORY, useClass: PaymentRepository }
  ],
  controllers: [PaymentController]
})
export class PaymentModule {}
```

### 7. Register in App Module
```typescript
// src/app.module.ts
import { PaymentModule } from './domains/payment/payment.module';

@Module({
  imports: [
    // ...
    PaymentModule
  ]
})
export class AppModule {}
```

## Best Practices

### Domain Layer
- ✅ Use TypeScript strict mode
- ✅ Immutable value objects
- ✅ Enforce business rules in entities
- ✅ No external dependencies (no NestJS, no database)
- ❌ Don't use async/await (pure functions preferred)

### Application Layer
- ✅ One use case per business operation
- ✅ Input/Output DTOs
- ✅ Result<T> for error handling
- ✅ Repository injection via ports
- ❌ Don't implement business rules (belongs in domain)

### Adapter Layer
- ✅ Thin controllers (just HTTP mapping)
- ✅ Repository implements port interface
- ✅ NestJS decorators only here
- ❌ Don't implement business logic

### Shared/Cross-Domain
- ✅ Base classes (BaseEntity, BaseValueObject)
- ✅ Common exceptions
- ✅ Shared utilities
- ✅ Event bus, cache, external APIs
- ❌ Don't add domain-specific logic

## Error Handling

All domain exceptions extend `DomainException`:

```typescript
// Domain layer
throw new BusinessRuleException('Email already exists');
throw new EntityNotFoundException('User', userId);
throw new ValidationException('Invalid email format', { email: ['Invalid'] });
throw new ConflictException('Duplicate entry');

// Global exception filter converts to HTTP responses
// See: src/shared/infrastructure/http/filters/domain-exception.filter.ts
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "User with email already exists"
  }
}
```

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "errors": {
      "email": ["Invalid email format"],
      "firstName": ["First name is required"]
    }
  }
}
```

## Testing Strategy

### Unit Tests (Domain Layer)
Test entities and value objects in isolation:
```typescript
describe('User Entity', () => {
  it('should create user with valid data', () => {
    const user = User.create('id', new Email('test@example.com'), 'John', 'Doe');
    expect(user.fullName).toBe('John Doe');
  });

  it('should throw on invalid email', () => {
    expect(() => new Email('invalid')).toThrow();
  });
});
```

### Integration Tests (Application Layer)
Test use cases with mock repositories:
```typescript
describe('CreateUserUseCase', () => {
  it('should create user successfully', async () => {
    const mockRepo = mock<IUserRepository>();
    const usecase = new CreateUserUseCase(mockRepo);

    const result = await usecase.execute({
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe'
    });

    expect(result.isSuccess).toBe(true);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### E2E Tests (Full Stack)
Test endpoints with real database:
```typescript
describe('User Endpoints', () => {
  it('POST /api/v1/users should create user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .send({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

## Further Reading

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Hexagonal Architecture by Alistair Cockburn](https://alistair.cockburn.us/hexagonal-architecture/)
- [NestJS Documentation](https://docs.nestjs.com/)

## Contributing

When adding new features:
1. Start with domain entities (business logic)
2. Create use cases (application logic)
3. Define ports (interfaces)
4. Implement adapters (HTTP, Database)
5. Write tests (unit, integration, E2E)
6. Update this README with new domain documentation

---

**Architecture Principles**: Clean Architecture + DDD + Hexagonal Architecture
**Framework**: NestJS with TypeScript
**Testing**: Jest + Supertest
**Database**: PostgreSQL (via TypeORM)
**Status**: Production-ready
