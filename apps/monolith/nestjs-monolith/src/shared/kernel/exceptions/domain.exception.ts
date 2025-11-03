/**
 * Base Domain Exception
 * Used for domain-level errors
 */
export class DomainException extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'DOMAIN_ERROR', statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = this.constructor.name;
  }
}

/**
 * Business Rule Exception
 * When a business rule is violated
 */
export class BusinessRuleException extends DomainException {
  constructor(message: string, code: string = 'BUSINESS_RULE_VIOLATION') {
    super(message, code, 422);
  }
}

/**
 * Entity Not Found Exception
 */
export class EntityNotFoundException extends DomainException {
  constructor(entityName: string, id: string | number) {
    super(
      `${entityName} with id ${id} not found`,
      'ENTITY_NOT_FOUND',
      404
    );
  }
}

/**
 * Validation Exception
 */
export class ValidationException extends DomainException {
  public readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR', 422);
    this.errors = errors;
  }
}

/**
 * Conflict Exception
 * When there's a conflict (e.g., duplicate entry)
 */
export class ConflictException extends DomainException {
  constructor(message: string, code: string = 'CONFLICT') {
    super(message, code, 409);
  }
}

/**
 * Unauthorized Exception
 */
export class UnauthorizedException extends DomainException {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

/**
 * Forbidden Exception
 */
export class ForbiddenException extends DomainException {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}
