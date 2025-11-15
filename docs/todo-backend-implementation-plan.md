# Simple Todo Backend - Implementation Plan

## Overview

A lightweight REST API for todo management using Fastify framework and MVC architecture pattern.

### Tech Stack

- **Framework**: Fastify
- **Language**: Node.js/TypeScript
- **Database**: PostgreSQL (or in-memory for MVP)
- **Validation**: @fastify/type-provider-typebox
- **ORM**: Prisma or raw SQL queries

---

## Project Structure

```
apps/services/todo-nodejs-service/
├── src/
│   ├── controllers/
│   │   └── todo.controller.ts       # Request handlers
│   ├── models/
│   │   └── todo.model.ts            # Data access layer
│   ├── routes/
│   │   └── todo.routes.ts           # Route definitions
│   ├── types/
│   │   └── todo.types.ts            # TypeScript interfaces
│   ├── config/
│   │   └── database.ts              # DB connection
│   ├── app.ts                       # Fastify app setup
│   └── server.ts                    # Entry point
├── tests/
│   ├── unit/
│   └── integration/
├── .env.example
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## Data Model

### Todo Entity

```typescript
interface Todo {
  id: string;              // UUID
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Database Schema

```sql
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_todos_completed ON todos(completed);
```

---

## API Endpoints

### REST API Routes

```
GET    /api/v1/todos           # List all todos
GET    /api/v1/todos/:id       # Get single todo
POST   /api/v1/todos           # Create todo
PUT    /api/v1/todos/:id       # Update todo (full)
PATCH  /api/v1/todos/:id       # Toggle completion
DELETE /api/v1/todos/:id       # Delete todo

GET    /health                 # Health check
```

### Request/Response Examples

#### GET /api/v1/todos

**Response (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false,
      "createdAt": "2025-11-15T10:30:00Z",
      "updatedAt": "2025-11-15T10:30:00Z"
    }
  ]
}
```

#### POST /api/v1/todos

**Request Body**:
```json
{
  "title": "Buy groceries",
  "description": "Milk, eggs, bread"
}
```

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "completed": false,
    "createdAt": "2025-11-15T10:30:00Z",
    "updatedAt": "2025-11-15T10:30:00Z"
  }
}
```

#### PUT /api/v1/todos/:id

**Request Body**:
```json
{
  "title": "Buy groceries (updated)",
  "description": "Milk, eggs, bread, cheese",
  "completed": true
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Buy groceries (updated)",
    "description": "Milk, eggs, bread, cheese",
    "completed": true,
    "createdAt": "2025-11-15T10:30:00Z",
    "updatedAt": "2025-11-15T11:00:00Z"
  }
}
```

#### PATCH /api/v1/todos/:id

**Response (200 OK)** - Toggles completion status:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "completed": true
  }
}
```

#### DELETE /api/v1/todos/:id

**Response (204 No Content)**

#### Error Response

**Response (404 Not Found)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Todo not found"
  }
}
```

**Response (400 Bad Request)**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      }
    ]
  }
}
```

---

## Dependencies

### package.json

```json
{
  "name": "todo-nodejs-service",
  "version": "1.0.0",
  "description": "Simple Todo REST API with Fastify",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "fastify": "^4.25.0",
    "@fastify/cors": "^8.5.0",
    "@fastify/env": "^4.3.0",
    "pg": "^8.11.3",
    "uuid": "^9.0.1",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/pg": "^8.10.9",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.0",
    "tsx": "^4.7.0",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

---

## Implementation Steps

### Step 1: Project Setup

**Tasks**:
- [ ] Create project directory: `apps/services/todo-nodejs-service`
- [ ] Initialize package.json: `npm init -y`
- [ ] Install dependencies
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Set up folder structure
- [ ] Create .env.example file
- [ ] Add .gitignore

**Commands**:
```bash
mkdir -p apps/services/todo-nodejs-service
cd apps/services/todo-nodejs-service
npm init -y
npm install fastify @fastify/cors @fastify/env pg uuid dotenv
npm install -D @types/node @types/pg @types/uuid typescript tsx vitest
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

### Step 2: Database Layer (Model)

**Tasks**:
- [ ] Create database configuration file
- [ ] Write SQL migration script
- [ ] Implement TodoModel with CRUD methods

**Files to create**:

**src/config/database.ts**:
```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected database error', err);
  process.exit(-1);
});

export const initDatabase = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
    `);
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
};
```

**src/types/todo.types.ts**:
```typescript
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  completed?: boolean;
}
```

**src/models/todo.model.ts**:
```typescript
import { pool } from '../config/database';
import { Todo, CreateTodoDto, UpdateTodoDto } from '../types/todo.types';

export class TodoModel {
  static async findAll(): Promise<Todo[]> {
    const result = await pool.query(
      'SELECT id, title, description, completed, created_at as "createdAt", updated_at as "updatedAt" FROM todos ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async findById(id: string): Promise<Todo | null> {
    const result = await pool.query(
      'SELECT id, title, description, completed, created_at as "createdAt", updated_at as "updatedAt" FROM todos WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async create(data: CreateTodoDto): Promise<Todo> {
    const { title, description } = data;
    const result = await pool.query(
      'INSERT INTO todos (title, description) VALUES ($1, $2) RETURNING id, title, description, completed, created_at as "createdAt", updated_at as "updatedAt"',
      [title, description]
    );
    return result.rows[0];
  }

  static async update(id: string, data: UpdateTodoDto): Promise<Todo | null> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.completed !== undefined) {
      fields.push(`completed = $${paramCount++}`);
      values.push(data.completed);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE todos SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING id, title, description, completed, created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  static async toggleComplete(id: string): Promise<Todo | null> {
    const result = await pool.query(
      'UPDATE todos SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, title, description, completed, created_at as "createdAt", updated_at as "updatedAt"',
      [id]
    );
    return result.rows[0] || null;
  }
}
```

---

### Step 3: Controller Layer

**Tasks**:
- [ ] Implement controller methods for all CRUD operations
- [ ] Add error handling
- [ ] Add input validation

**src/controllers/todo.controller.ts**:
```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { TodoModel } from '../models/todo.model';
import { CreateTodoDto, UpdateTodoDto } from '../types/todo.types';

interface TodoParams {
  id: string;
}

export class TodoController {
  static async getAllTodos(request: FastifyRequest, reply: FastifyReply) {
    try {
      const todos = await TodoModel.findAll();
      return reply.code(200).send({
        success: true,
        data: todos,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch todos',
        },
      });
    }
  }

  static async getTodoById(
    request: FastifyRequest<{ Params: TodoParams }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const todo = await TodoModel.findById(id);

      if (!todo) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Todo not found',
          },
        });
      }

      return reply.code(200).send({
        success: true,
        data: todo,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch todo',
        },
      });
    }
  }

  static async createTodo(
    request: FastifyRequest<{ Body: CreateTodoDto }>,
    reply: FastifyReply
  ) {
    try {
      const { title, description } = request.body;

      if (!title || title.trim() === '') {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title is required',
          },
        });
      }

      const todo = await TodoModel.create({ title, description });

      return reply.code(201).send({
        success: true,
        data: todo,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create todo',
        },
      });
    }
  }

  static async updateTodo(
    request: FastifyRequest<{ Params: TodoParams; Body: UpdateTodoDto }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const updateData = request.body;

      const todo = await TodoModel.update(id, updateData);

      if (!todo) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Todo not found',
          },
        });
      }

      return reply.code(200).send({
        success: true,
        data: todo,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update todo',
        },
      });
    }
  }

  static async toggleTodo(
    request: FastifyRequest<{ Params: TodoParams }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const todo = await TodoModel.toggleComplete(id);

      if (!todo) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Todo not found',
          },
        });
      }

      return reply.code(200).send({
        success: true,
        data: todo,
      });
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to toggle todo',
        },
      });
    }
  }

  static async deleteTodo(
    request: FastifyRequest<{ Params: TodoParams }>,
    reply: FastifyReply
  ) {
    try {
      const { id } = request.params;
      const deleted = await TodoModel.delete(id);

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Todo not found',
          },
        });
      }

      return reply.code(204).send();
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to delete todo',
        },
      });
    }
  }
}
```

---

### Step 4: Routes

**Tasks**:
- [ ] Define routes in todo.routes.ts
- [ ] Wire routes to controller methods
- [ ] Add request validation schemas (optional)

**src/routes/todo.routes.ts**:
```typescript
import { FastifyInstance } from 'fastify';
import { TodoController } from '../controllers/todo.controller';

export default async function todoRoutes(fastify: FastifyInstance) {
  // List all todos
  fastify.get('/api/v1/todos', TodoController.getAllTodos);

  // Get single todo
  fastify.get('/api/v1/todos/:id', TodoController.getTodoById);

  // Create todo
  fastify.post('/api/v1/todos', TodoController.createTodo);

  // Update todo (full)
  fastify.put('/api/v1/todos/:id', TodoController.updateTodo);

  // Toggle completion
  fastify.patch('/api/v1/todos/:id', TodoController.toggleTodo);

  // Delete todo
  fastify.delete('/api/v1/todos/:id', TodoController.deleteTodo);
}
```

---

### Step 5: App Configuration

**Tasks**:
- [ ] Set up Fastify instance
- [ ] Add CORS, logging, error handling
- [ ] Register routes
- [ ] Add health check endpoint

**src/app.ts**:
```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import todoRoutes from './routes/todo.routes';

export function buildApp() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // Register CORS
  fastify.register(cors, {
    origin: true,
  });

  // Health check endpoint
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Register routes
  fastify.register(todoRoutes);

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    request.log.error(error);
    reply.code(error.statusCode || 500).send({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
    });
  });

  return fastify;
}
```

**src/server.ts**:
```typescript
import { buildApp } from './app';
import { initDatabase } from './config/database';

const start = async () => {
  try {
    // Initialize database
    await initDatabase();

    // Build and start Fastify app
    const fastify = buildApp();

    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });

    console.log(`Server listening on http://${host}:${port}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
```

---

### Step 6: Testing

**Tasks**:
- [ ] Write unit tests for models
- [ ] Write integration tests for API endpoints
- [ ] Achieve 80%+ coverage

**tests/unit/todo.model.test.ts**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TodoModel } from '../../src/models/todo.model';
import { pool } from '../../src/config/database';

describe('TodoModel', () => {
  beforeAll(async () => {
    // Initialize test database
    await pool.query('CREATE TABLE IF NOT EXISTS todos (...)');
  });

  afterAll(async () => {
    // Cleanup
    await pool.query('DROP TABLE IF EXISTS todos');
    await pool.end();
  });

  it('should create a new todo', async () => {
    const todo = await TodoModel.create({
      title: 'Test Todo',
      description: 'Test Description',
    });

    expect(todo).toBeDefined();
    expect(todo.title).toBe('Test Todo');
    expect(todo.completed).toBe(false);
  });

  it('should find all todos', async () => {
    const todos = await TodoModel.findAll();
    expect(Array.isArray(todos)).toBe(true);
  });

  // Add more tests...
});
```

**tests/integration/todo.routes.test.ts**:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app';

describe('Todo API Routes', () => {
  let app: any;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health - should return healthy status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload).status).toBe('healthy');
  });

  it('POST /api/v1/todos - should create a new todo', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/todos',
      payload: {
        title: 'Test Todo',
        description: 'Test Description',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Test Todo');
  });

  it('GET /api/v1/todos - should return all todos', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/todos',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  // Add more tests...
});
```

---

### Step 7: Docker & Documentation

**Tasks**:
- [ ] Create Dockerfile
- [ ] Create .dockerignore
- [ ] Add to docker-compose.yml
- [ ] Write comprehensive README

**Dockerfile**:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
RUN npm ci --only=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
```

**.dockerignore**:
```
node_modules
dist
.env
.git
.gitignore
*.md
tests
coverage
```

**README.md**:
```markdown
# Todo API Service

Simple REST API for managing todos built with Fastify and TypeScript.

## Features

- Full CRUD operations for todos
- RESTful API design
- PostgreSQL database
- MVC architecture
- TypeScript
- Docker support
- Health check endpoint

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
4. Update environment variables
5. Start PostgreSQL (via Docker Compose or local install)

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t todo-api .
docker run -p 3000:3000 --env-file .env todo-api
```

## API Documentation

See [API Endpoints](#api-endpoints) section in the implementation plan.

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Environment Variables

See `.env.example` for all required variables.

## License

MIT
```

---

## Environment Variables

### .env.example

```bash
# Application
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/todos_db

# CORS (optional)
CORS_ORIGIN=*
```

---

## Quality Gates

Before marking this implementation as complete, ensure:

- ✅ All CRUD endpoints working correctly
- ✅ Request validation implemented
- ✅ Proper error handling for 400/404/500 status codes
- ✅ Unit tests passing with 80%+ coverage
- ✅ Integration tests passing
- ✅ Health check endpoint responding
- ✅ Docker build successful
- ✅ Lint passing (no errors)
- ✅ Database migrations working
- ✅ API documentation complete
- ✅ README.md written

---

## Estimated Implementation Time

| Task | Estimated Time |
|------|----------------|
| Setup & Structure | 30 minutes |
| Model Layer | 1 hour |
| Controller Layer | 1 hour |
| Routes & Validation | 30 minutes |
| Testing | 1-2 hours |
| Docker & Documentation | 30 minutes |
| **Total** | **4-5 hours** |

---

## Next Steps After Implementation

1. **Add Authentication** - JWT-based auth for protected routes
2. **Add Pagination** - For GET /todos endpoint
3. **Add Filtering** - Filter by completed status
4. **Add Sorting** - Sort by date, title, etc.
5. **Add Search** - Full-text search on title/description
6. **Add Categories/Tags** - Organize todos by category
7. **Add Due Dates** - Add deadline functionality
8. **Add Priority Levels** - High, medium, low priority
9. **Add User Associations** - Multi-user support
10. **Add Soft Deletes** - Keep deleted todos in database

---

## Architecture Notes

This implementation follows the **MVC (Model-View-Controller)** pattern:

- **Model**: `src/models/todo.model.ts` - Data access layer
- **View**: JSON responses (no traditional view layer in REST APIs)
- **Controller**: `src/controllers/todo.controller.ts` - Request handling and business logic

### Flow Diagram

```
HTTP Request
    ↓
Routes (src/routes/todo.routes.ts)
    ↓
Controller (src/controllers/todo.controller.ts)
    ↓
Model (src/models/todo.model.ts)
    ↓
Database (PostgreSQL)
    ↓
Response back through layers
    ↓
HTTP Response (JSON)
```

---

## Security Considerations

- ✅ Use parameterized queries to prevent SQL injection
- ✅ Validate all user inputs
- ✅ Implement rate limiting (future enhancement)
- ✅ Use HTTPS in production
- ✅ Sanitize error messages (don't expose internal details)
- ✅ Use environment variables for sensitive data
- ✅ Implement CORS properly
- ✅ Add authentication/authorization (future enhancement)

---

## Performance Optimization

- Use connection pooling (pg Pool)
- Add database indexes on frequently queried columns
- Implement caching with Redis (future enhancement)
- Use prepared statements
- Add pagination for large datasets
- Monitor and log slow queries

---

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## References

- [Fastify Documentation](https://www.fastify.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [REST API Best Practices](https://restfulapi.net/)
- [MVC Pattern](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller)

---

*Last Updated: 2025-11-15*
