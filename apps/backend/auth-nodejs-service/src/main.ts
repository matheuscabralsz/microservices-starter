import Fastify from 'fastify';
import { authPlugin } from './auth-plugin';

async function bootstrap() {
  const app = Fastify({ logger: true });

  await app.register(authPlugin);

  // follow this structure: https://www.youtube.com/watch?v=mULWHLquYP0
  app.get('/', async () => ({ name: 'auth-nodejs-service' }));

  const port = parseInt(process.env.PORT || '3001', 10);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
