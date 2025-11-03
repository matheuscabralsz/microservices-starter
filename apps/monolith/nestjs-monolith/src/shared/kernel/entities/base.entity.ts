/**
 * Base Entity class following Clean Architecture principles
 * All domain entities should inherit from this class
 */
export abstract class BaseEntity<T> {
  public id: T;
  public createdAt: Date;
  public updatedAt: Date;
  public deletedAt?: Date;

  constructor(id: T, createdAt: Date = new Date(), updatedAt: Date = new Date()) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Soft delete the entity
   */
  public delete(): void {
    this.deletedAt = new Date();
  }

  /**
   * Restore soft-deleted entity
   */
  public restore(): void {
    this.deletedAt = undefined;
  }

  /**
   * Check if entity is soft deleted
   */
  public isDeleted(): boolean {
    return this.deletedAt !== undefined && this.deletedAt !== null;
  }

  /**
   * Update modification timestamp
   */
  public updateTimestamp(): void {
    this.updatedAt = new Date();
  }

  /**
   * Compare two entities by ID
   */
  public equals(other: BaseEntity<T>): boolean {
    return this.id === other.id;
  }
}
