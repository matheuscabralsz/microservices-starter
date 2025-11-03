import { User } from '../../domain/entities/user.entity';
import { PaginatedResult } from '../../../../shared/kernel/interfaces/result.interface';

/**
 * User Repository Port (Interface)
 * Hexagonal Architecture outbound port for data persistence
 * Implementations should be in adapters/repositories
 */
export interface IUserRepository {
  /**
   * Save a new user
   */
  save(user: User): Promise<void>;

  /**
   * Update an existing user
   */
  update(user: User): Promise<void>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Get all users with pagination
   */
  findAll(page: number, pageSize: number): Promise<PaginatedResult<User>>;

  /**
   * Get active users
   */
  findActive(page: number, pageSize: number): Promise<PaginatedResult<User>>;

  /**
   * Check if email exists
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Delete user (soft delete)
   */
  delete(id: string): Promise<void>;

  /**
   * Restore soft-deleted user
   */
  restore(id: string): Promise<void>;
}

/**
 * Provider token for dependency injection
 */
export const USER_REPOSITORY = 'USER_REPOSITORY';
