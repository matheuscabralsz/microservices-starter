import { BaseValueObject } from '../../../../shared/kernel/value-objects/base.value-object';
import { ValidationException } from '../../../../shared/kernel/exceptions/domain.exception';

/**
 * Email Value Object
 * Ensures email is always valid
 */
export class Email extends BaseValueObject<string> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(value: string) {
    super(value.toLowerCase().trim());
  }

  /**
   * Validate email format
   */
  protected validate(value: string): void {
    if (!value || value.length === 0) {
      throw new ValidationException('Email cannot be empty', { email: ['Email is required'] });
    }

    if (value.length > 254) {
      throw new ValidationException('Email is too long', { email: ['Email must be less than 254 characters'] });
    }

    if (!Email.EMAIL_REGEX.test(value)) {
      throw new ValidationException('Invalid email format', { email: ['Email format is invalid'] });
    }
  }

  /**
   * Get the email value
   */
  public get value(): string {
    return this._value;
  }

  /**
   * Compare two email value objects
   */
  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  /**
   * String representation
   */
  public toString(): string {
    return this._value;
  }

  /**
   * JSON serialization
   */
  public toJSON(): string {
    return this._value;
  }
}
