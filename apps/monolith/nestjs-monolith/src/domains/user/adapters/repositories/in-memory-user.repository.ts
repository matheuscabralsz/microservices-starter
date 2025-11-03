import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../ports/repositories/user.repository.port';
import { PaginatedResult } from '../../../../shared/kernel/interfaces/result.interface';

/**
 * In-Memory User Repository Adapter
 * Hexagonal Architecture inbound adapter
 * For development/testing purposes
 */
@Injectable()
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> id mapping

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
    this.emailIndex.set(user.email.toString(), user.id);
  }

  async update(user: User): Promise<void> {
    this.users.set(user.id, user);
    // Update email index if email changed
    const existingUser = this.users.get(user.id);
    if (existingUser && existingUser.email.toString() !== user.email.toString()) {
      this.emailIndex.delete(existingUser.email.toString());
      this.emailIndex.set(user.email.toString(), user.id);
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userId = this.emailIndex.get(email.toLowerCase());
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async findAll(page: number, pageSize: number): Promise<PaginatedResult<User>> {
    const allUsers = Array.from(this.users.values()).filter(u => !u.isDeleted());
    const total = allUsers.length;
    const start = (page - 1) * pageSize;
    const items = allUsers.slice(start, start + pageSize);

    return PaginatedResult.create(items, total, page, pageSize);
  }

  async findActive(page: number, pageSize: number): Promise<PaginatedResult<User>> {
    const activeUsers = Array.from(this.users.values()).filter(u => u.isActive && !u.isDeleted());
    const total = activeUsers.length;
    const start = (page - 1) * pageSize;
    const items = activeUsers.slice(start, start + pageSize);

    return PaginatedResult.create(items, total, page, pageSize);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.emailIndex.has(email.toLowerCase());
  }

  async delete(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.delete();
    }
  }

  async restore(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.restore();
    }
  }

  /**
   * Development/Testing helper - clear all data
   */
  clear(): void {
    this.users.clear();
    this.emailIndex.clear();
  }
}
