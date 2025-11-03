/**
 * PolyStack Monolith Backend - NestJS
 * Clean Architecture + Domain-Driven Design + Hexagonal Architecture
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['debug', 'error', 'log', 'warn']
  });

  // Global Prefix
  const apiPrefix = 'api';
  app.setGlobalPrefix(apiPrefix);

  // Get configuration from environment
  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  // Start application
  await app.listen(port, host as string);

  // Log startup information
  Logger.log(
    `🚀 PolyStack Monolith Backend is running on: http://${host}:${port}/${apiPrefix}`,
    'NestFactory'
  );
  Logger.log(
    `📝 API Documentation: http://${host}:${port}/${apiPrefix}/docs`,
    'NestFactory'
  );
  Logger.log(
    `💚 Health Check: http://${host}:${port}/${apiPrefix}/health`,
    'NestFactory'
  );
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
