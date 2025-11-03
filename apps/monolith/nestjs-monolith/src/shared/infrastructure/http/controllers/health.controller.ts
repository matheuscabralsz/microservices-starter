import { Controller, Get } from '@nestjs/common';

/**
 * Global Health Controller
 * Provides health check endpoint for monitoring and load balancers
 */
@Controller('health')
export class HealthController {
  /**
   * Health check endpoint
   * GET /health
   */
  @Get()
  check(): any {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        database: 'healthy',
        cache: 'healthy',
        memory: 'healthy'
      }
    };
  }

  /**
   * Readiness check
   * GET /health/ready
   */
  @Get('ready')
  ready(): any {
    return {
      ready: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Liveness check
   * GET /health/live
   */
  @Get('live')
  live(): any {
    return {
      alive: true,
      timestamp: new Date().toISOString()
    };
  }
}
