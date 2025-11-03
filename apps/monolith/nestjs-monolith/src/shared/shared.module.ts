import { Module } from '@nestjs/common';
import { HealthController } from './infrastructure/http/controllers/health.controller';
import { DomainExceptionFilter } from './infrastructure/http/filters/domain-exception.filter';

/**
 * Shared Module
 * Provides global infrastructure, utilities, and common components
 */
@Module({
  controllers: [HealthController],
  providers: [DomainExceptionFilter],
  exports: [DomainExceptionFilter]
})
export class SharedModule {}
