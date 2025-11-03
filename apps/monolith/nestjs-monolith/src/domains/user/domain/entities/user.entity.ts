import { BaseEntity } from '../../../../shared/kernel/entities/base.entity';
import { Email } from '../value-objects/email.value-object';
import { BusinessRuleException } from '../../../../shared/kernel/exceptions/domain.exception';

/**
 * User Domain Entity
 * Core business logic for users
 */
export class User extends BaseEntity<string> {
  private constructor(
    id: string,
    private _email: Email,
    private _firstName: string,
    private _lastName: string,
    private _isActive: boolean,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    deletedAt?: Date
  ) {
    super(id, createdAt, updatedAt);
    this.deletedAt = deletedAt;
  }

  /**
   * Factory method to create a new user
   */
  public static create(
    id: string,
    email: Email,
    firstName: string,
    lastName: string
  ): User {
    if (!firstName || firstName.trim().length === 0) {
      throw new BusinessRuleException('First name is required');
    }

    if (!lastName || lastName.trim().length === 0) {
      throw new BusinessRuleException('Last name is required');
    }

    return new User(id, email, firstName, lastName, true);
  }

  /**
   * Reconstruct user from persistent storage
   */
  public static reconstitute(
    id: string,
    email: Email,
    firstName: string,
    lastName: string,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
    deletedAt?: Date
  ): User {
    const user = new User(id, email, firstName, lastName, isActive, createdAt, updatedAt, deletedAt);
    return user;
  }

  // Getters
  public get email(): Email {
    return this._email;
  }

  public get firstName(): string {
    return this._firstName;
  }

  public get lastName(): string {
    return this._lastName;
  }

  public get fullName(): string {
    return `${this._firstName} ${this._lastName}`;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  // Domain Methods
  /**
   * Update user email
   */
  public updateEmail(email: Email): void {
    if (this.isDeleted()) {
      throw new BusinessRuleException('Cannot update deleted user');
    }
    this._email = email;
    this.updateTimestamp();
  }

  /**
   * Update user profile
   */
  public updateProfile(firstName: string, lastName: string): void {
    if (this.isDeleted()) {
      throw new BusinessRuleException('Cannot update deleted user');
    }

    if (!firstName || firstName.trim().length === 0) {
      throw new BusinessRuleException('First name is required');
    }

    if (!lastName || lastName.trim().length === 0) {
      throw new BusinessRuleException('Last name is required');
    }

    this._firstName = firstName;
    this._lastName = lastName;
    this.updateTimestamp();
  }

  /**
   * Activate user
   */
  public activate(): void {
    if (this.isDeleted()) {
      throw new BusinessRuleException('Cannot activate deleted user');
    }
    this._isActive = true;
    this.updateTimestamp();
  }

  /**
   * Deactivate user
   */
  public deactivate(): void {
    this._isActive = false;
    this.updateTimestamp();
  }
}
