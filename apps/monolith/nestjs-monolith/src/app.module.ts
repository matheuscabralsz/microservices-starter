import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { UserModule } from './domains/user/user.module';
import { SharedModule } from './shared/shared.module';
import { DomainExceptionFilter } from './shared/infrastructure/http/filters/domain-exception.filter';

/**
 * Root Application Module
 * Imports all domain modules and configures the application
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local']
    }),
    // Shared Infrastructure
    SharedModule,

    // Domain Modules
    UserModule

    // Add more domain modules here as you develop them:
    // PaymentModule,
    // OrderModule,
    // NotificationModule,
    // ProductModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter
    }
  ]
})
export class AppModule {}
