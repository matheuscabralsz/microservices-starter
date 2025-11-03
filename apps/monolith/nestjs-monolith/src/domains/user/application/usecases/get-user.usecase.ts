import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../ports/repositories/user.repository.port';
import { Result } from '../../../../shared/kernel/interfaces/result.interface';
import { EntityNotFoundException } from '../../../../shared/kernel/exceptions/domain.exception';

/**
 * Get User Use Case
 */
@Injectable()
export class GetUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(id: string): Promise<Result<GetUserOutput>> {
    try {
      const user = await this.userRepository.findById(id);

      if (!user) {
        return Result.fail(new EntityNotFoundException('User', id));
      }

      return Result.ok({
        id: user.id,
        email: user.email.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt
      });
    } catch (error) {
      return Result.fail(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export interface GetUserOutput {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
