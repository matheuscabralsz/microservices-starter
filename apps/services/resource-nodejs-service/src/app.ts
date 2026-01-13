import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { registerResourceRoutes } from './routes/resource.routes';
import { pool } from './config/database';
import { HealthResponse } from './schemas/resource.schemas';

export function buildApp(): FastifyInstance {
  const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

  app.register(cors, { origin: true });

  app.setErrorHandler((err, _req, reply) => {
    const status = (err.statusCode as number) || 500;
    const message = status === 500 ? 'Internal server error' : err.message;
    reply.code(status).send({
      success: false,
      error: { code: String(status), message, details: [] },
    });
  });

  app.register(swagger, {
    openapi: {
      info: {
        title: 'Resource API',
        version: '0.1.0',
        description: 'A RESTful API service for managing resources, built with Fastify, TypeScript, and PostgreSQL.',
        contact: {
          name: 'API Support',
          url: 'https://github.com/polystack',
        },
        license: {
          name: 'Private',
        },
      },
      servers: [
        {
          url: 'http://localhost:3106',
          description: 'Development server',
        },
      ],
      tags: [
        { name: 'resources', description: 'Resource management endpoints' },
        { name: 'health', description: 'Health check endpoints' },
      ],
    },
  });
  app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });

  app.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['health'],
      summary: 'Check service health',
      response: {
        200: HealthResponse,
      },
    },
  }, async () => {
    // Simple health check, try a lightweight DB query
    try {
      await pool.query('SELECT 1');
      return { status: 'healthy' as const };
    } catch {
      return { status: 'degraded' as const };
    }
  });

  app.register(registerResourceRoutes);

  return app;
}
