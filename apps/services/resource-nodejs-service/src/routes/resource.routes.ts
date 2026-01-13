import { Static } from '@sinclair/typebox';
import { FastifyInstance } from 'fastify';
import {
  createResource,
  deleteResource,
  getResource,
  listResources,
  toggleResource,
  updateResource,
} from '../controllers/resource.controller';
import {
  ResourceParams,
  CreateResourceBody,
  UpdateResourceBody,
  ResourceListResponse,
  ResourceItemResponse,
  ErrorResponse,
} from '../schemas/resource.schemas';

export async function registerResourceRoutes(app: FastifyInstance) {
  // List all resources
  app.get('/api/v1/resources', {
    schema: {
      description: 'Retrieve a list of all resources',
      tags: ['resources'],
      summary: 'List all resources',
      response: {
        200: ResourceListResponse,
        500: ErrorResponse,
      },
    },
  }, listResources);

  // Get single resource
  app.get<{
    Params: Static<typeof ResourceParams>;
  }>(
    '/api/v1/resources/:id',
    {
      schema: {
        description: 'Retrieve a specific resource by ID',
        tags: ['resources'],
        summary: 'Get resource by ID',
        params: ResourceParams,
        response: {
          200: ResourceItemResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    getResource
  );

  // Create new resource
  app.post<{
    Body: Static<typeof CreateResourceBody>;
  }>(
    '/api/v1/resources',
    {
      schema: {
        description: 'Create a new resource item',
        tags: ['resources'],
        summary: 'Create resource',
        body: CreateResourceBody,
        response: {
          201: ResourceItemResponse,
          400: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    createResource
  );

  // Update resource (full replace)
  app.put<{
    Params: Static<typeof ResourceParams>;
    Body: Static<typeof UpdateResourceBody>;
  }>(
    '/api/v1/resources/:id',
    {
      schema: {
        description: 'Update an existing resource (full replacement)',
        tags: ['resources'],
        summary: 'Update resource',
        params: ResourceParams,
        body: UpdateResourceBody,
        response: {
          200: ResourceItemResponse,
          404: ErrorResponse,
          400: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    updateResource
  );

  // Toggle completion status
  app.patch<{
    Params: Static<typeof ResourceParams>;
  }>(
    '/api/v1/resources/:id',
    {
      schema: {
        description: 'Toggle the completion status of a resource',
        tags: ['resources'],
        summary: 'Toggle resource completion',
        params: ResourceParams,
        response: {
          200: ResourceItemResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    toggleResource
  );

  // Delete resource
  app.delete<{
    Params: Static<typeof ResourceParams>;
  }>(
    '/api/v1/resources/:id',
    {
      schema: {
        description: 'Delete a resource by ID',
        tags: ['resources'],
        summary: 'Delete resource',
        params: ResourceParams,
        response: {
          200: ResourceItemResponse,
          404: ErrorResponse,
          500: ErrorResponse,
        },
      },
    },
    deleteResource
  );
}
