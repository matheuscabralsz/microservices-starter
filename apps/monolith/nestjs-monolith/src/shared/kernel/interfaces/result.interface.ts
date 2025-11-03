/**
 * Result type for handling success/failure in a functional way
 * Useful for use cases and domain operations
 */
export class Result<T> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  public readonly error?: Error;
  public readonly value?: T;

  private constructor(
    isSuccess: boolean,
    value?: T,
    error?: Error
  ) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.value = value;
    this.error = error;
  }

  /**
   * Create a successful result
   */
  public static ok<U>(value: U): Result<U> {
    return new Result<U>(true, value);
  }

  /**
   * Create a failed result
   */
  public static fail<U>(error: Error): Result<U> {
    return new Result<U>(false, undefined, error);
  }

  /**
   * Combine multiple results
   */
  public static combine<U>(results: Result<U>[]): Result<U[]> {
    const errors = results.filter(r => r.isFailure).map(r => r.error);
    if (errors.length > 0) {
      return Result.fail(new Error(`Multiple errors: ${errors.map(e => e?.message).join(', ')}`));
    }
    return Result.ok(results.map(r => r.value!));
  }

  /**
   * Transform the value if successful
   */
  public map<U>(fn: (value: T) => U): Result<U> {
    if (this.isFailure) {
      return Result.fail<U>(this.error!);
    }
    try {
      return Result.ok(fn(this.value!));
    } catch (e) {
      return Result.fail<U>(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * Chain results
   */
  public flatMap<U>(fn: (value: T) => Result<U>): Result<U> {
    if (this.isFailure) {
      return Result.fail<U>(this.error!);
    }
    return fn(this.value!);
  }

  /**
   * Handle both success and failure
   */
  public fold<U>(onFailure: (error: Error) => U, onSuccess: (value: T) => U): U {
    return this.isFailure ? onFailure(this.error!) : onSuccess(this.value!);
  }

  /**
   * Get value or throw error
   */
  public getValueOrThrow(): T {
    if (this.isFailure) {
      throw this.error;
    }
    return this.value!;
  }
}

/**
 * Paginated result for list operations
 */
export class PaginatedResult<T> {
  constructor(
    public readonly items: T[],
    public readonly total: number,
    public readonly page: number,
    public readonly pageSize: number,
    public readonly totalPages: number
  ) {}

  public static create<U>(
    items: U[],
    total: number,
    page: number,
    pageSize: number
  ): PaginatedResult<U> {
    const totalPages = Math.ceil(total / pageSize);
    return new PaginatedResult(items, total, page, pageSize, totalPages);
  }
}
