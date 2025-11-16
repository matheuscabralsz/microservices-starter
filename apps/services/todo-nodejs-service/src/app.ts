import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { registerTodoRoutes } from './routes/todo.routes';
import { pool } from './config/database';

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
      info: { title: 'Todo API', version: '0.1.0' },
      servers: [{ url: '/' }],
    },
  });
  app.register(swaggerUi, { routePrefix: '/api/docs' });

  app.get('/health', async () => {
    // Simple health check, try a lightweight DB query
    try {
      await pool.query('SELECT 1');
      return { status: 'healthy' };
    } catch {
      return { status: 'degraded' };
    }
  });

  app.register(registerTodoRoutes);

  return app;
}
