/**
 * Base Value Object class
 * Value Objects are immutable and compared by value, not identity
 */
export abstract class BaseValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this.validate(value);
    this._value = value;
  }

  /**
   * Get the value
   */
  public getValue(): T {
    return this._value;
  }

  /**
   * Validate the value object
   * Must be implemented by concrete value objects
   */
  protected abstract validate(value: T): void;

  /**
   * Compare two value objects by value
   */
  public abstract equals(other: BaseValueObject<T>): boolean;

  /**
   * String representation
   */
  public abstract toString(): string;
}
