import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { IUserRepository } from '../../ports/repositories/user.repository.port';
import { Result } from '../../../../shared/kernel/interfaces/result.interface';
import { ConflictException } from '../../../../shared/kernel/exceptions/domain.exception';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create User Use Case
 * Application layer - orchestrates domain logic
 */
@Injectable()
export class CreateUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * Execute the use case
   */
  async execute(input: CreateUserInput): Promise<Result<CreateUserOutput>> {
    try {
      // Check if email already exists
      const emailExists = await this.userRepository.existsByEmail(input.email);
      if (emailExists) {
        return Result.fail(
          new ConflictException(
            `User with email ${input.email} already exists`,
            'EMAIL_ALREADY_EXISTS'
          )
        );
      }

      // Create email value object
      const email = new Email(input.email);

      // Create user entity
      const userId = uuidv4();
      const user = User.create(
        userId,
        email,
        input.firstName,
        input.lastName
      );

      // Persist user
      await this.userRepository.save(user);

      // Return output
      return Result.ok({
        id: user.id,
        email: user.email.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        isActive: user.isActive,
        createdAt: user.createdAt
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * Input DTO
 */
export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Output DTO
 */
export interface CreateUserOutput {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
}
