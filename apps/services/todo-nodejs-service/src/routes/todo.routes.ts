import { Static, Type } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import {
  createTodo,
  deleteTodo,
  getTodo,
  listTodos,
  toggleTodo,
  updateTodo,
} from '../controllers/todo.controller';

const TodoParams = Type.Object({ id: Type.String({ format: 'uuid' }) });
const CreateTodoBody = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.Optional(Type.String({ maxLength: 2000 })),
});
const UpdateTodoBody = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.Optional(Type.Union([Type.String({ maxLength: 2000 }), Type.Null()])),
  completed: Type.Boolean(),
});

export async function registerTodoRoutes(app: FastifyInstance) {
  // List
  app.get('/api/v1/todos', { schema: { response: { 200: Type.Object({ success: Type.Boolean(), data: Type.Array(Type.Any()) }) } } }, listTodos);

  // Get
  app.get<{
    Params: Static<typeof TodoParams>;
  }>(
    '/api/v1/todos/:id',
    { schema: { params: TodoParams } },
    getTodo
  );

  // Create
  app.post<{
    Body: Static<typeof CreateTodoBody>;
  }>(
    '/api/v1/todos',
    { schema: { body: CreateTodoBody } },
    createTodo
  );

  // Update (full)
  app.put<{
    Params: Static<typeof TodoParams>;
    Body: Static<typeof UpdateTodoBody>;
  }>(
    '/api/v1/todos/:id',
    { schema: { params: TodoParams, body: UpdateTodoBody } },
    updateTodo
  );

  // Toggle completion
  app.patch<{
    Params: Static<typeof TodoParams>;
  }>(
    '/api/v1/todos/:id',
    { schema: { params: TodoParams } },
    toggleTodo
  );

  // Delete
  app.delete<{
    Params: Static<typeof TodoParams>;
  }>(
    '/api/v1/todos/:id',
    { schema: { params: TodoParams } },
    deleteTodo
  );
}
