import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  HttpCode,
  BadRequestException,
  Inject
} from '@nestjs/common';
import { CreateUserUseCase, CreateUserInput } from '../../application/usecases/create-user.usecase';
import { GetUserUseCase } from '../../application/usecases/get-user.usecase';
import { USER_REPOSITORY, IUserRepository } from '../../ports/repositories/user.repository.port';

/**
 * User Controller
 * Hexagonal Architecture inbound adapter for HTTP requests
 */
@Controller('api/v1/users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase
  ) {}

  /**
   * Create a new user
   * POST /api/v1/users
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserRequestDto): Promise<any> {
    const input: CreateUserInput = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName
    };

    const result = await this.createUserUseCase.execute(input);

    return result.fold(
      (error) => {
        throw new BadRequestException({
          success: false,
          error: {
            code: error instanceof Error ? (error as any).code || 'ERROR' : 'ERROR',
            message: error.message,
            statusCode: (error as any).statusCode || 400
          }
        });
      },
      (output) => ({
        success: true,
        data: output
      })
    );
  }

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<any> {
    const result = await this.getUserUseCase.execute(id);

    return result.fold(
      (error) => {
        throw new BadRequestException({
          success: false,
          error: {
            code: error instanceof Error ? (error as any).code || 'ERROR' : 'ERROR',
            message: error.message,
            statusCode: (error as any).statusCode || 400
          }
        });
      },
      (output) => ({
        success: true,
        data: output
      })
    );
  }

  /**
   * Health check
   * GET /api/v1/users/health
   */
  @Get('health/check')
  async health(): Promise<any> {
    return {
      success: true,
      status: 'healthy',
      service: 'user-service'
    };
  }
}

/**
 * Request DTOs
 */
export interface CreateUserRequestDto {
  email: string;
  firstName: string;
  lastName: string;
}
