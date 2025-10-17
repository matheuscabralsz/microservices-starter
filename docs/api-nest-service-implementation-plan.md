# API-NestJS-Service Implementation Plan
## Simple TODO CRUD Microservice

**Service Name**: `api-nest-service`
**Framework**: NestJS (TypeScript)
**Port**: 3100
**Purpose**: Learning-focused TODO CRUD microservice demonstrating NestJS patterns

---

## Table of Contents

1. [Overview](#overview)
2. [Technical Stack](#technical-stack)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Directory Structure](#directory-structure)
6. [Implementation Phases](#implementation-phases)
7. [Key Components](#key-components)
8. [Environment Configuration](#environment-configuration)
9. [Testing Strategy](#testing-strategy)
10. [Quality Gates](#quality-gates)
11. [Deployment](#deployment)

---

## Overview

The `api-nest-service` is a **simple TODO CRUD microservice** built to demonstrate NestJS best practices. This is a learning-focused implementation without authentication complexity.

### Goals
- Demonstrate clean NestJS architecture
- Implement all CRUD operations with proper validation
- **100% passing tests** with 80%+ code coverage
- Follow all PolyStack coding conventions
- Provide OpenAPI documentation
- Use structured JSON logging
- Deploy via Docker container

### Success Criteria
✅ All CRUD endpoints functional
✅ Input validation working on all endpoints
✅ **100% passing tests** with 80%+ code coverage
✅ Swagger documentation accessible at `/api/docs`
✅ Health check endpoint responding
✅ Structured JSON logs output
✅ Docker image builds and runs successfully
✅ Service connects to PostgreSQL
✅ All quality gates passing (build, test, lint)

---

## Technical Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | NestJS | Latest |
| **Language** | TypeScript | 5.x |
| **Runtime** | Node.js | 18+ |
| **Database** | PostgreSQL | 15+ |
| **ORM** | TypeORM | Latest |
| **Validation** | class-validator | Latest |
| **Documentation** | Swagger/OpenAPI | 3.0 |
| **Logging** | Winston | Latest |
| **Testing** | Jest + Supertest | Latest |
| **Container** | Docker | Alpine-based |

### Key Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "typeorm": "^0.3.0",
    "pg": "^8.11.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "winston": "^3.11.0",
    "nest-winston": "^1.9.0"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "@types/jest": "^29.0.0",
    "@types/supertest": "^6.0.0"
  }
}
```

---

## Database Schema

### Table: `todos`

```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  due_date TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- Indexes for performance
CREATE INDEX idx_todos_status ON todos(status);
CREATE INDEX idx_todos_priority ON todos(priority);
CREATE INDEX idx_todos_deleted_at ON todos(deleted_at);
CREATE INDEX idx_todos_created_at ON todos(created_at DESC);
```

### Field Specifications

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | UUID | No | gen_random_uuid() | Primary key |
| `title` | VARCHAR(255) | No | - | Todo title |
| `description` | TEXT | Yes | NULL | Detailed description |
| `status` | VARCHAR(50) | No | 'pending' | Current status (pending, in_progress, completed) |
| `priority` | VARCHAR(20) | No | 'medium' | Priority level (low, medium, high) |
| `due_date` | TIMESTAMP | Yes | NULL | Due date/time |
| `created_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | No | CURRENT_TIMESTAMP | Last update timestamp |
| `deleted_at` | TIMESTAMP | Yes | NULL | Soft delete timestamp |

### Enums

**Status Values:**
- `pending` - Todo not started
- `in_progress` - Todo being worked on
- `completed` - Todo finished

**Priority Values:**
- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority

---

## API Endpoints

### Base URL
```
http://localhost:3100/api/v1
```

### Endpoint Specifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/api/docs` | Swagger documentation |
| GET | `/api/v1/todos` | List all todos (paginated, filtered) |
| GET | `/api/v1/todos/:id` | Get single todo by ID |
| POST | `/api/v1/todos` | Create new todo |
| PUT | `/api/v1/todos/:id` | Update todo (full replace) |
| PATCH | `/api/v1/todos/:id` | Update todo (partial) |
| DELETE | `/api/v1/todos/:id` | Delete todo (soft delete) |

### Query Parameters

**GET /api/v1/todos** supports:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (starts at 1) |
| `limit` | number | 10 | Items per page (max: 100) |
| `status` | string | - | Filter by status (pending, in_progress, completed) |
| `priority` | string | - | Filter by priority (low, medium, high) |
| `sortBy` | string | created_at | Field to sort by |
| `sortOrder` | string | desc | Sort order (asc, desc) |
| `search` | string | - | Search in title and description |

**Example:**
```
GET /api/v1/todos?page=1&limit=20&status=pending&priority=high&sortBy=due_date&sortOrder=asc
```

### Request/Response Examples

#### 1. Create Todo (POST /api/v1/todos)

**Request:**
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive README and API docs",
  "priority": "high",
  "dueDate": "2025-10-20T17:00:00Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Complete project documentation",
    "description": "Write comprehensive README and API docs",
    "status": "pending",
    "priority": "high",
    "dueDate": "2025-10-20T17:00:00Z",
    "createdAt": "2025-10-17T10:30:00Z",
    "updatedAt": "2025-10-17T10:30:00Z"
  }
}
```

#### 2. List Todos (GET /api/v1/todos)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Complete project documentation",
      "description": "Write comprehensive README and API docs",
      "status": "pending",
      "priority": "high",
      "dueDate": "2025-10-20T17:00:00Z",
      "createdAt": "2025-10-17T10:30:00Z",
      "updatedAt": "2025-10-17T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

#### 3. Update Todo (PATCH /api/v1/todos/:id)

**Request:**
```json
{
  "status": "in_progress",
  "description": "Updated description with more details"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Complete project documentation",
    "description": "Updated description with more details",
    "status": "in_progress",
    "priority": "high",
    "dueDate": "2025-10-20T17:00:00Z",
    "createdAt": "2025-10-17T10:30:00Z",
    "updatedAt": "2025-10-17T11:15:00Z"
  }
}
```

#### 4. Error Response

**Response (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "title should not be empty"
      },
      {
        "field": "priority",
        "message": "priority must be one of: low, medium, high"
      }
    ]
  },
  "timestamp": "2025-10-17T11:20:00Z",
  "path": "/api/v1/todos"
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request format or validation errors |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server-side error |

---

## Directory Structure

```
apps/services/api-nest-service/
├── src/
│   ├── config/                           # Configuration modules
│   │   ├── database.config.ts            # TypeORM configuration
│   │   └── logger.config.ts              # Winston logger config
│   │
│   ├── modules/
│   │   ├── todos/                        # Todo module
│   │   │   ├── dto/
│   │   │   │   ├── create-todo.dto.ts    # Create validation
│   │   │   │   ├── update-todo.dto.ts    # Update validation
│   │   │   │   └── query-todo.dto.ts     # Query/filter validation
│   │   │   ├── entities/
│   │   │   │   └── todo.entity.ts        # TypeORM entity
│   │   │   ├── todos.controller.ts       # HTTP endpoints
│   │   │   ├── todos.service.ts          # Business logic
│   │   │   ├── todos.repository.ts       # Data access layer
│   │   │   └── todos.module.ts           # Module definition
│   │   │
│   │   └── health/                       # Health check module
│   │       ├── health.controller.ts
│   │       └── health.module.ts
│   │
│   ├── common/                           # Shared utilities
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts  # Global exception filter
│   │   │   └── all-exceptions.filter.ts  # Catch-all filter
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts    # Request/response logging
│   │   │   └── transform.interceptor.ts  # Response transformation
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts        # Global validation
│   │   ├── interfaces/
│   │   │   ├── response.interface.ts     # Standard response
│   │   │   └── pagination.interface.ts   # Pagination metadata
│   │   └── constants/
│   │       └── app.constants.ts          # App-wide constants
│   │
│   ├── migrations/                       # TypeORM migrations
│   │   └── 1697500000000-CreateTodosTable.ts
│   │
│   ├── app.module.ts                     # Root module
│   └── main.ts                           # Application entry point
│
├── test/                                 # Test files
│   ├── unit/
│   │   ├── todos.service.spec.ts
│   │   ├── todos.controller.spec.ts
│   │   └── todos.repository.spec.ts
│   ├── integration/
│   │   └── todos-database.spec.ts
│   └── e2e/
│       └── todos.e2e-spec.ts
│
├── Dockerfile                            # Multi-stage Docker build
├── .dockerignore
├── docker-compose.yml                    # Local development
├── .env                                  # Local env (gitignored)
├── .env.example                          # Example env file
├── ormconfig.ts                          # TypeORM config
├── jest.config.ts                        # Jest configuration
├── tsconfig.json                         # TypeScript config
├── tsconfig.app.json
├── tsconfig.spec.json
├── package.json
├── project.json                          # Nx project config
└── README.md                             # Service documentation
```

---

## Implementation Phases

### Phase 1: Project Setup (Tasks 1-4)
**Estimated Time**: 1-2 hours

#### Task 1: Set up NestJS project structure and dependencies
- Initialize NestJS application using Nx generator
- Install required dependencies (TypeORM, PostgreSQL, Winston, Swagger)
- Configure TypeScript strict mode
- Set up basic project structure

**Commands:**
```bash
# Generate NestJS application
nx generate @nx/nest:application api-nest-service

# Install dependencies
npm install --save @nestjs/typeorm typeorm pg
npm install --save @nestjs/swagger swagger-ui-express
npm install --save class-validator class-transformer
npm install --save winston nest-winston

# Install dev dependencies
npm install --save-dev @types/supertest
```

**Deliverables:**
- ✅ Nx project generated at `apps/services/api-nest-service`
- ✅ All dependencies installed
- ✅ `package.json` updated with dependencies
- ✅ Basic folder structure created

---

#### Task 2: Configure TypeORM with PostgreSQL database connection
- Create database configuration module
- Set up TypeORM connection with PostgreSQL
- Configure connection pooling
- Set up migration configuration

**Files to Create:**
- `src/config/database.config.ts`
- `ormconfig.ts`

**Configuration Details:**
```typescript
// ormconfig.ts
export default {
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'polystack_dev',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false, // Always false in production
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DATABASE_SSL === 'true',
};
```

**Deliverables:**
- ✅ Database configuration file created
- ✅ TypeORM module imported in `app.module.ts`
- ✅ Connection tested and working

---

#### Task 3: Create Todo entity with standard database columns
- Define Todo entity with TypeORM decorators
- Include all standard columns (id, created_at, updated_at, deleted_at)
- Set up indexes for performance

**File to Create:**
- `src/modules/todos/entities/todo.entity.ts`

**Entity Specification:**
```typescript
@Entity('todos')
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  })
  @Index()
  status: string;

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  priority: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
```

**Deliverables:**
- ✅ Todo entity created with all fields
- ✅ Indexes defined for query performance
- ✅ Soft delete enabled with deletedAt

---

#### Task 4: Generate database migration for todos table
- Generate TypeORM migration
- Review and customize migration SQL
- Test migration up and down

**Commands:**
```bash
# Generate migration
npm run typeorm migration:generate -- -n CreateTodosTable

# Run migration
npm run typeorm migration:run

# Revert migration (for testing)
npm run typeorm migration:revert
```

**Deliverables:**
- ✅ Migration file created in `src/migrations/`
- ✅ Migration successfully runs against database
- ✅ Table created with correct schema
- ✅ Indexes created

---

### Phase 2: Core Features (Tasks 5-8)
**Estimated Time**: 2-3 hours

#### Task 5: Create DTOs for Todo validation
- Create DTOs for create, update, and query operations
- Add validation decorators from class-validator
- Add Swagger decorators for API documentation

**Files to Create:**
- `src/modules/todos/dto/create-todo.dto.ts`
- `src/modules/todos/dto/update-todo.dto.ts`
- `src/modules/todos/dto/query-todo.dto.ts`

**Deliverables:**
- ✅ CreateTodoDto with validation
- ✅ UpdateTodoDto with partial validation
- ✅ QueryTodoDto for filtering and pagination
- ✅ All DTOs documented with Swagger decorators

---

#### Task 6: Implement TodoRepository for database operations
- Create custom repository with TypeORM
- Implement CRUD methods
- Add pagination and filtering logic
- Handle soft deletes properly

**File to Create:**
- `src/modules/todos/todos.repository.ts`

**Key Methods:**
- `findAllPaginated()` - List with pagination and filters
- `findOneById()` - Get single todo by ID
- `createTodo()` - Create new todo
- `updateTodo()` - Update existing todo
- `softDelete()` - Soft delete todo

**Deliverables:**
- ✅ TodoRepository class created
- ✅ All CRUD methods implemented
- ✅ Pagination logic working
- ✅ Soft delete handling

---

#### Task 7: Implement TodoService with business logic
- Create service layer with business logic
- Validate business rules
- Handle errors properly
- Add logging

**File to Create:**
- `src/modules/todos/todos.service.ts`

**Key Methods:**
```typescript
@Injectable()
export class TodosService {
  constructor(
    private readonly todosRepository: TodosRepository,
    private readonly logger: Logger,
  ) {}

  async findAll(query: QueryTodoDto): Promise<PaginatedResponse<Todo>>
  async findOne(id: string): Promise<Todo>
  async create(createTodoDto: CreateTodoDto): Promise<Todo>
  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<Todo>
  async remove(id: string): Promise<void>
}
```

**Deliverables:**
- ✅ TodoService created with all methods
- ✅ Business logic implemented
- ✅ Error handling added
- ✅ Logging integrated

---

#### Task 8: Create TodoController with REST endpoints
- Create controller with all REST endpoints
- Add route decorators
- Add Swagger documentation decorators

**File to Create:**
- `src/modules/todos/todos.controller.ts`

**Controller Structure:**
```typescript
@Controller('api/v1/todos')
@ApiTags('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  @ApiOperation({ summary: 'List all todos' })
  async findAll(@Query() query: QueryTodoDto)

  @Get(':id')
  @ApiOperation({ summary: 'Get todo by ID' })
  async findOne(@Param('id') id: string)

  @Post()
  @ApiOperation({ summary: 'Create new todo' })
  async create(@Body() createTodoDto: CreateTodoDto)

  @Patch(':id')
  @ApiOperation({ summary: 'Update todo' })
  async update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto)

  @Delete(':id')
  @ApiOperation({ summary: 'Delete todo' })
  async remove(@Param('id') id: string)
}
```

**Deliverables:**
- ✅ TodoController created
- ✅ All endpoints implemented
- ✅ Swagger documentation added

---

### Phase 3: Cross-Cutting Concerns (Tasks 9-12)
**Estimated Time**: 2-3 hours

#### Task 9: Add global validation pipe and error handling
- Create global validation pipe
- Create exception filters
- Create response interceptors
- Standardize error responses

**Files to Create:**
- `src/common/filters/http-exception.filter.ts`
- `src/common/filters/all-exceptions.filter.ts`
- `src/common/interceptors/transform.interceptor.ts`
- `src/common/pipes/validation.pipe.ts`

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [...]
  },
  "timestamp": "2025-10-17T11:20:00Z",
  "path": "/api/v1/todos"
}
```

**Deliverables:**
- ✅ Global validation pipe active
- ✅ Exception filters catching errors
- ✅ Response transformer working
- ✅ Consistent error format

---

#### Task 10: Implement health check endpoint
- Create health check module
- Check database connectivity
- Check dependencies status
- Return proper health status

**File to Create:**
- `src/modules/health/health.controller.ts`

**Health Check Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "timestamp": "2025-10-17T11:30:00Z",
  "checks": {
    "database": "healthy",
    "memory": {
      "status": "healthy",
      "used": "150MB",
      "limit": "512MB"
    }
  }
}
```

**Deliverables:**
- ✅ Health endpoint at `/health`
- ✅ Database health check
- ✅ Memory usage check
- ✅ Proper status codes (200/503)

---

#### Task 11: Configure Swagger/OpenAPI documentation
- Install Swagger module
- Configure Swagger in main.ts
- Add API tags and descriptions
- Generate OpenAPI spec file

**Configuration:**
```typescript
const config = new DocumentBuilder()
  .setTitle('PolyStack API - NestJS Service')
  .setDescription('TODO CRUD API documentation')
  .setVersion('1.0')
  .addTag('todos', 'Todo CRUD operations')
  .addTag('health', 'Health check endpoints')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

**Deliverables:**
- ✅ Swagger UI accessible at `/api/docs`
- ✅ All endpoints documented
- ✅ Request/response schemas visible
- ✅ OpenAPI spec exported to file

---

#### Task 12: Add structured JSON logging with Winston
- Configure Winston logger
- Create custom logger service
- Add logging interceptor
- Log all requests and errors

**File to Create:**
- `src/config/logger.config.ts`

**Log Format:**
```json
{
  "timestamp": "2025-10-17T11:35:00Z",
  "level": "info",
  "service": "api-nest-service",
  "message": "Todo created successfully",
  "context": {
    "todoId": "todo-456",
    "method": "POST",
    "path": "/api/v1/todos",
    "statusCode": 201,
    "responseTime": "45ms"
  }
}
```

**Deliverables:**
- ✅ Winston logger configured
- ✅ JSON structured logs
- ✅ Request/response logging
- ✅ Error logging with stack traces

---

### Phase 4: Testing (Tasks 13-16)
**Estimated Time**: 4-5 hours

#### Task 13: Write unit tests for TodoService
- Test all service methods
- Mock repository layer
- Test business logic
- Test error scenarios

**File to Create:**
- `test/unit/todos.service.spec.ts`

**Test Cases:**
- ✅ Create todo with valid data
- ✅ Create todo with invalid data (throws error)
- ✅ Find all todos with pagination
- ✅ Find todo by ID (success)
- ✅ Find todo by ID (not found)
- ✅ Update todo (success)
- ✅ Update todo (not found)
- ✅ Delete todo (success)
- ✅ Delete todo (not found)

**Coverage Target**: 80%+ for TodoService
**Test Pass Requirement**: **100% passing**

---

#### Task 14: Write unit tests for TodoController
- Test all controller methods
- Mock service layer
- Test request validation
- Test response formatting

**File to Create:**
- `test/unit/todos.controller.spec.ts`

**Test Cases:**
- ✅ GET /todos returns paginated list
- ✅ GET /todos/:id returns single todo
- ✅ POST /todos creates new todo
- ✅ PATCH /todos/:id updates todo
- ✅ DELETE /todos/:id deletes todo
- ✅ Validation errors return 400

**Coverage Target**: 80%+ for TodoController
**Test Pass Requirement**: **100% passing**

---

#### Task 15: Write integration tests for database operations
- Test with real database (test container or test DB)
- Test CRUD operations end-to-end
- Test transactions
- Test data integrity

**File to Create:**
- `test/integration/todos-database.spec.ts`

**Test Cases:**
- ✅ Create todo saves to database
- ✅ Find todos returns correct data
- ✅ Update todo persists changes
- ✅ Delete todo soft deletes record
- ✅ Pagination works correctly
- ✅ Filtering by status works
- ✅ Filtering by priority works
- ✅ Search functionality works

**Test Pass Requirement**: **100% passing**

---

#### Task 16: Write E2E tests for all API endpoints
- Test full HTTP request/response cycle
- Use Supertest for HTTP requests
- Test error scenarios

**File to Create:**
- `test/e2e/todos.e2e-spec.ts`

**Test Cases:**
- ✅ POST /api/v1/todos creates todo (201)
- ✅ GET /api/v1/todos lists todos (200)
- ✅ GET /api/v1/todos/:id returns todo (200)
- ✅ GET /api/v1/todos/:id returns 404 for non-existent
- ✅ PATCH /api/v1/todos/:id updates todo (200)
- ✅ DELETE /api/v1/todos/:id deletes todo (204)
- ✅ Invalid request data returns 400
- ✅ Validation errors return proper format

**Test Pass Requirement**: **100% passing**

---

### Phase 5: DevOps (Tasks 17-19)
**Estimated Time**: 2-3 hours

#### Task 17: Create Dockerfile with multi-stage build
- Create optimized Dockerfile
- Use multi-stage build
- Include health check
- Minimize image size

**File to Create:**
- `Dockerfile`

**Deliverables:**
- ✅ Dockerfile created
- ✅ Multi-stage build working
- ✅ Image builds successfully
- ✅ Image size optimized (<200MB)
- ✅ Container runs and responds to health check

---

#### Task 18: Add .env.example file with all required variables
- Document all environment variables
- Provide example values
- Add descriptions
- Group by category

**File to Create:**
- `.env.example`

**Deliverables:**
- ✅ .env.example created
- ✅ All variables documented
- ✅ Safe example values provided

---

#### Task 19: Create service README with setup and usage instructions
- Document service purpose
- Provide setup instructions
- List API endpoints
- Include examples

**File to Create:**
- `README.md`

**Sections:**
- Overview
- Features
- Prerequisites
- Installation
- Configuration
- Running the Service
- API Documentation
- Testing
- Docker Deployment
- Troubleshooting

**Deliverables:**
- ✅ Comprehensive README created
- ✅ All commands documented
- ✅ Examples provided
- ✅ Troubleshooting section included

---

### Phase 6: Quality Assurance (Task 20)
**Estimated Time**: 1-2 hours

#### Task 20: Run all quality gates (tests, build, lint, coverage)
- Run all tests
- Check code coverage
- Run linting
- Build for production
- Verify Docker build
- Test in Docker container

**Commands to Run:**
```bash
# Run all tests
nx test api-nest-service --coverage

# Run E2E tests
nx e2e api-nest-service-e2e

# Lint code
nx lint api-nest-service

# Build for production
nx build api-nest-service --configuration=production

# Build Docker image
docker build -t api-nest-service:latest .

# Run Docker container
docker run -p 3100:3100 --env-file .env api-nest-service:latest

# Test health endpoint
curl http://localhost:3100/health
```

**Quality Gate Checklist:**
- ✅ **All unit tests pass (100%)**
- ✅ **All integration tests pass (100%)**
- ✅ **All E2E tests pass (100%)**
- ✅ Code coverage ≥ 80%
- ✅ No linting errors
- ✅ Production build succeeds
- ✅ Docker image builds successfully
- ✅ Service runs in Docker
- ✅ Health check responds with 200
- ✅ Swagger docs accessible
- ✅ All endpoints functional
- ✅ Validation working
- ✅ Error handling working
- ✅ Logs are JSON formatted

---

## Key Components

### 1. Todo Entity

**File**: `src/modules/todos/entities/todo.entity.ts`

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('todos')
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending',
  })
  @Index()
  status: 'pending' | 'in_progress' | 'completed';

  @Column({
    type: 'enum',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  @Index()
  priority: 'low' | 'medium' | 'high';

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  @Index()
  deletedAt: Date;
}
```

---

### 2. Create Todo DTO

**File**: `src/modules/todos/dto/create-todo.dto.ts`

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTodoDto {
  @ApiProperty({
    description: 'Title of the todo',
    example: 'Complete project documentation',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the todo',
    example: 'Write comprehensive README and API documentation',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  })
  @IsEnum(['low', 'medium', 'high'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high';

  @ApiPropertyOptional({
    description: 'Due date in ISO 8601 format',
    example: '2025-10-20T17:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
```

---

### 3. Todo Service (Simplified)

**File**: `src/modules/todos/todos.service.ts`

```typescript
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { TodosRepository } from './todos.repository';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { Todo } from './entities/todo.entity';
import { PaginatedResponse } from '../../common/interfaces/response.interface';

@Injectable()
export class TodosService {
  private readonly logger = new Logger(TodosService.name);

  constructor(private readonly todosRepository: TodosRepository) {}

  async findAll(query: QueryTodoDto): Promise<PaginatedResponse<Todo>> {
    this.logger.log('Finding all todos');

    const [todos, total] = await this.todosRepository.findAllPaginated(query);
    const totalPages = Math.ceil(total / query.limit);

    return {
      success: true,
      data: todos,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<Todo> {
    this.logger.log(`Finding todo ${id}`);

    const todo = await this.todosRepository.findOneById(id);

    if (!todo) {
      throw new NotFoundException(`Todo with ID ${id} not found`);
    }

    return todo;
  }

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    this.logger.log('Creating new todo');

    const todo = await this.todosRepository.createTodo(createTodoDto);

    this.logger.log(`Todo created with ID ${todo.id}`);
    return todo;
  }

  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    this.logger.log(`Updating todo ${id}`);

    await this.findOne(id); // Check if exists

    const updatedTodo = await this.todosRepository.updateTodo(id, updateTodoDto);

    this.logger.log(`Todo ${id} updated successfully`);
    return updatedTodo;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Deleting todo ${id}`);

    await this.findOne(id); // Check if exists
    await this.todosRepository.softDelete(id);

    this.logger.log(`Todo ${id} deleted successfully`);
  }
}
```

---

### 4. Todo Controller (Simplified)

**File**: `src/modules/todos/todos.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';

@ApiTags('todos')
@Controller('api/v1/todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiResponse({ status: 201, description: 'Todo created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todosService.create(createTodoDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all todos with pagination' })
  @ApiResponse({ status: 200, description: 'Todos retrieved successfully' })
  findAll(@Query() query: QueryTodoDto) {
    return this.todosService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single todo by ID' })
  @ApiResponse({ status: 200, description: 'Todo retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  findOne(@Param('id') id: string) {
    return this.todosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo' })
  @ApiResponse({ status: 200, description: 'Todo updated successfully' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto) {
    return this.todosService.update(id, updateTodoDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiResponse({ status: 204, description: 'Todo deleted successfully' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  remove(@Param('id') id: string) {
    return this.todosService.remove(id);
  }
}
```

---

## Environment Configuration

### .env.example

```bash
# ==============================================
# API-NestJS-Service Environment Configuration
# ==============================================

# ======================
# Service Configuration
# ======================
NODE_ENV=development
PORT=3100
HOST=0.0.0.0
API_VERSION=v1
API_PREFIX=api
LOG_LEVEL=debug

# ======================
# Database Configuration
# ======================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=polystack_dev
DATABASE_SSL=false
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# ======================
# CORS Configuration
# ======================
CORS_ORIGIN=http://localhost:3000,http://localhost:4200
CORS_CREDENTIALS=true

# ======================
# Rate Limiting
# ======================
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# ======================
# Swagger Documentation
# ======================
SWAGGER_ENABLED=true
SWAGGER_PATH=api/docs

# ======================
# Observability
# ======================
SENTRY_DSN=
SENTRY_ENVIRONMENT=development
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# ======================
# Health Check
# ======================
HEALTH_CHECK_DATABASE_TIMEOUT=5000
HEALTH_CHECK_MEMORY_THRESHOLD=512
```

---

## Testing Strategy

### 1. Unit Tests

**Goal**: Test individual units in isolation with mocked dependencies.
**Coverage Target**: 80%+ for all services and controllers.
**Pass Requirement**: **100% of tests must pass**

**Test Structure (AAA Pattern):**
```typescript
describe('TodosService', () => {
  let service: TodosService;
  let repository: jest.Mocked<TodosRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        {
          provide: TodosRepository,
          useValue: {
            findAllPaginated: jest.fn(),
            findOneById: jest.fn(),
            createTodo: jest.fn(),
            updateTodo: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
    repository = module.get(TodosRepository);
  });

  describe('create', () => {
    it('should create a new todo successfully', async () => {
      // Arrange
      const createDto: CreateTodoDto = {
        title: 'Test Todo',
        description: 'Test Description',
      };
      const expectedTodo = {
        id: 'todo-123',
        ...createDto,
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      repository.createTodo.mockResolvedValue(expectedTodo as any);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(result).toEqual(expectedTodo);
      expect(repository.createTodo).toHaveBeenCalledWith(createDto);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when todo does not exist', async () => {
      // Arrange
      repository.findOneById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

---

## Quality Gates

Before marking implementation complete, verify ALL of the following:

### ✅ Tests (CRITICAL)
- [ ] **All unit tests pass (100%)**
- [ ] **All integration tests pass (100%)**
- [ ] **All E2E tests pass (100%)**
- [ ] Code coverage ≥ 80% for all modules
- [ ] Coverage report generated

### ✅ Build
- [ ] Development build succeeds
- [ ] Production build succeeds
- [ ] No TypeScript errors
- [ ] Bundle size is reasonable

### ✅ Code Quality
- [ ] Linting passes with no errors
- [ ] No security vulnerabilities (run `npm audit`)
- [ ] Code follows NestJS best practices
- [ ] All TODOs resolved or documented

### ✅ Functionality
- [ ] All CRUD endpoints working
- [ ] Pagination works correctly
- [ ] Filtering and sorting work
- [ ] Search functionality works
- [ ] Soft delete working properly

### ✅ Security
- [ ] Input validation working on all endpoints
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Rate limiting configured

### ✅ Documentation
- [ ] Swagger docs accessible at `/api/docs`
- [ ] All endpoints documented
- [ ] Request/response examples provided
- [ ] README.md complete
- [ ] .env.example provided

### ✅ Observability
- [ ] Health check endpoint responds
- [ ] Structured JSON logs output
- [ ] Request/response logging works
- [ ] Error logging includes stack traces

### ✅ Docker
- [ ] Docker image builds successfully
- [ ] Container runs without errors
- [ ] Health check works in container
- [ ] Environment variables work
- [ ] Service accessible on port 3100

### ✅ Database
- [ ] Migrations run successfully
- [ ] Database schema correct
- [ ] Indexes created
- [ ] Connection pooling configured

---

## Deployment

### Local Development

```bash
# Start local infrastructure
cd tools/local-dev
docker-compose up -d

# Install dependencies
npm install

# Run database migrations
npm run typeorm migration:run

# Start service
nx serve api-nest-service
```

### Docker Deployment

```bash
# Build image
docker build -t api-nest-service:latest .

# Run container
docker run -d \
  --name api-nest-service \
  -p 3100:3100 \
  --env-file .env \
  api-nest-service:latest

# Check health
curl http://localhost:3100/health
```

---

**Document Version**: 2.0 (Simplified - No Auth)
**Last Updated**: 2025-10-17
**Status**: Ready for Implementation
**Estimated Total Time**: 12-15 hours
