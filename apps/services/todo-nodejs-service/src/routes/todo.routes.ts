import { Static } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import {
  createTodo,
  deleteTodo,
  getTodo,
  listTodos,
  toggleTodo,
  updateTodo,
} from '../controllers/todo.controller';
import {
  TodoParams,
  CreateTodoBody,
  UpdateTodoBody,
  TodoListResponse,
  TodoItemResponse,
  ErrorResponse,
} from '../schemas/todo.schemas';

export async function registerTodoRoutes(app: FastifyInstance) {
  // List all todos
  app.get('/api/v1/todos', {
    schema: {
      description: 'Retrieve a list of all todos',
      tags: ['todos'],
      summary: 'List all todos',
      response: {
        200: TodoListResponse,
        500: ErrorResponse,
      },
    },
  }, listTodos);

  // Get single todo
  app.get<{
    Params: Static<typeof TodoParams>;
  }>(
    '/api/v1/todos/:id',
    {
      schema: {
        description: 'Retrieve a specific todo by ID',
        tags: ['todos'],
        summary: 'Get todo by ID',
        params: TodoParams,
        response: {
          200: TodoItemResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    getTodo
  );

  // Create new todo
  app.post<{
    Body: Static<typeof CreateTodoBody>;
  }>(
    '/api/v1/todos',
    {
      schema: {
        description: 'Create a new todo item',
        tags: ['todos'],
        summary: 'Create todo',
        body: CreateTodoBody,
        response: {
          201: TodoItemResponse,
          400: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    createTodo
  );

  // Update todo (full replace)
  app.put<{
    Params: Static<typeof TodoParams>;
    Body: Static<typeof UpdateTodoBody>;
  }>(
    '/api/v1/todos/:id',
    {
      schema: {
        description: 'Update an existing todo (full replacement)',
        tags: ['todos'],
        summary: 'Update todo',
        params: TodoParams,
        body: UpdateTodoBody,
        response: {
          200: TodoItemResponse,
          404: ErrorResponse,
          400: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    updateTodo
  );

  // Toggle completion status
  app.patch<{
    Params: Static<typeof TodoParams>;
  }>(
    '/api/v1/todos/:id',
    {
      schema: {
        description: 'Toggle the completion status of a todo',
        tags: ['todos'],
        summary: 'Toggle todo completion',
        params: TodoParams,
        response: {
          200: TodoItemResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    toggleTodo
  );

  // Delete todo
  app.delete<{
    Params: Static<typeof TodoParams>;
  }>(
    '/api/v1/todos/:id',
    {
      schema: {
        description: 'Delete a todo by ID',
        tags: ['todos'],
        summary: 'Delete todo',
        params: TodoParams,
        response: {
          200: TodoItemResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    deleteTodo
  );
}
