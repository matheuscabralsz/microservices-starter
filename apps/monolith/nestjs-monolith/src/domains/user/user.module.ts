import { Module } from '@nestjs/common';
import { UserController } from './adapters/controllers/user.controller';
import { InMemoryUserRepository } from './adapters/repositories/in-memory-user.repository';
import { CreateUserUseCase } from './application/usecases/create-user.usecase';
import { GetUserUseCase } from './application/usecases/get-user.usecase';
import { USER_REPOSITORY, IUserRepository } from './ports/repositories/user.repository.port';

/**
 * User Domain Module
 * Encapsulates all user-related use cases, domain logic, and adapters
 *
 * Architecture:
 * - Controllers (Inbound Adapters) -> Use Cases (Application) -> Entities (Domain) -> Repositories (Outbound Adapters)
 */
@Module({
  providers: [
    // Repository Implementation (Adapter Layer - Outbound)
    // For now using in-memory, can be replaced with database adapter
    {
      provide: USER_REPOSITORY,
      useClass: InMemoryUserRepository
    },
    InMemoryUserRepository,

    // Use Cases (Application Layer)
    {
      provide: CreateUserUseCase,
      useFactory: (repository: IUserRepository) => new CreateUserUseCase(repository),
      inject: [USER_REPOSITORY]
    },
    {
      provide: GetUserUseCase,
      useFactory: (repository: IUserRepository) => new GetUserUseCase(repository),
      inject: [USER_REPOSITORY]
    }
  ],
  controllers: [UserController],
  exports: [CreateUserUseCase, GetUserUseCase, USER_REPOSITORY]
})
export class UserModule {}
