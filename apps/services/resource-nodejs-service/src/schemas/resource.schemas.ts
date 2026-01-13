import { Type, Static } from '@sinclair/typebox';

// Resource response schema
export const ResourceSchema = Type.Object({
  id: Type.String({ format: 'uuid', description: 'Unique identifier' }),
  title: Type.String({ description: 'Resource title', minLength: 1, maxLength: 255 }),
  description: Type.Union([Type.String({ maxLength: 2000 }), Type.Null()], {
    description: 'Optional resource description',
  }),
  completed: Type.Boolean({ description: 'Completion status' }),
  createdAt: Type.String({ format: 'date-time', description: 'Creation timestamp' }),
  updatedAt: Type.String({ format: 'date-time', description: 'Last update timestamp' }),
}, {
  $id: 'Resource',
  description: 'Resource item',
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
export const ResourceParams = Type.Object({
  id: Type.String({ format: 'uuid', description: 'Resource ID' }),
}, { $id: 'ResourceParams' });

export const CreateResourceBody = Type.Object({
  title: Type.String({
    minLength: 1,
    maxLength: 255,
    description: 'Resource title',
    examples: ['Learn Fastify'],
  }),
  description: Type.Optional(Type.String({
    maxLength: 2000,
    description: 'Optional description',
    examples: ['Study Fastify documentation and build a REST API'],
  })),
}, {
  $id: 'CreateResourceBody',
  description: 'Request body for creating a resource',
});

export const UpdateResourceBody = Type.Object({
  title: Type.String({
    minLength: 1,
    maxLength: 255,
    description: 'Resource title',
  }),
  description: Type.Optional(Type.Union([Type.String({ maxLength: 2000 }), Type.Null()], {
    description: 'Optional description (null to clear)',
  })),
  completed: Type.Boolean({ description: 'Completion status' }),
}, {
  $id: 'UpdateResourceBody',
  description: 'Request body for updating a resource',
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
      message: 'Resource not found',
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
export const ResourceListResponse = SuccessResponse(Type.Array(ResourceSchema));
export const ResourceItemResponse = SuccessResponse(ResourceSchema);

// TypeScript types
export type Resource = Static<typeof ResourceSchema>;
export type CreateResourceBody = Static<typeof CreateResourceBody>;
export type UpdateResourceBody = Static<typeof UpdateResourceBody>;
