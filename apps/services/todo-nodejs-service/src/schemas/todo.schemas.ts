import { Type, Static } from '@sinclair/typebox';

// Todo response schema
export const TodoSchema = Type.Object({
  id: Type.String({ format: 'uuid', description: 'Unique identifier' }),
  title: Type.String({ description: 'Todo title', minLength: 1, maxLength: 255 }),
  description: Type.Union([Type.String({ maxLength: 2000 }), Type.Null()], {
    description: 'Optional todo description',
  }),
  completed: Type.Boolean({ description: 'Completion status' }),
  createdAt: Type.String({ format: 'date-time', description: 'Creation timestamp' }),
  updatedAt: Type.String({ format: 'date-time', description: 'Last update timestamp' }),
}, {
  $id: 'Todo',
  description: 'Todo item',
  examples: [{
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Learn Fastify',
    description: 'Study Fastify documentation and build a REST API',
    completed: false,
    createdAt: '2025-11-16T00:00:00.000Z',
    updatedAt: '2025-11-16T00:00:00.000Z',
  }],
});

// Request schemas
export const TodoParams = Type.Object({
  id: Type.String({ format: 'uuid', description: 'Todo ID' }),
}, { $id: 'TodoParams' });

export const CreateTodoBody = Type.Object({
  title: Type.String({
    minLength: 1,
    maxLength: 255,
    description: 'Todo title',
    examples: ['Learn Fastify'],
  }),
  description: Type.Optional(Type.String({
    maxLength: 2000,
    description: 'Optional description',
    examples: ['Study Fastify documentation and build a REST API'],
  })),
}, {
  $id: 'CreateTodoBody',
  description: 'Request body for creating a todo',
});

export const UpdateTodoBody = Type.Object({
  title: Type.String({
    minLength: 1,
    maxLength: 255,
    description: 'Todo title',
  }),
  description: Type.Optional(Type.Union([Type.String({ maxLength: 2000 }), Type.Null()], {
    description: 'Optional description (null to clear)',
  })),
  completed: Type.Boolean({ description: 'Completion status' }),
}, {
  $id: 'UpdateTodoBody',
  description: 'Request body for updating a todo',
});

// Response wrappers
export const SuccessResponse = (dataSchema: any) =>
  Type.Object({
    success: Type.Literal(true),
    data: dataSchema,
  }, { description: 'Successful response' });

export const ErrorResponse = Type.Object({
  success: Type.Literal(false),
  error: Type.Object({
    code: Type.String({ description: 'Error code' }),
    message: Type.String({ description: 'Error message' }),
    details: Type.Array(Type.Any(), { description: 'Error details' }),
  }),
}, {
  $id: 'ErrorResponse',
  description: 'Error response',
  examples: [{
    success: false,
    error: {
      code: '404',
      message: 'Todo not found',
      details: [],
    },
  }],
});

export const HealthResponse = Type.Object({
  status: Type.Union([Type.Literal('healthy'), Type.Literal('degraded')]),
}, {
  $id: 'HealthResponse',
  description: 'Health check response',
});

// Response types
export const TodoListResponse = SuccessResponse(Type.Array(TodoSchema));
export const TodoItemResponse = SuccessResponse(TodoSchema);

// TypeScript types
export type Todo = Static<typeof TodoSchema>;
export type CreateTodoBody = Static<typeof CreateTodoBody>;
export type UpdateTodoBody = Static<typeof UpdateTodoBody>;
