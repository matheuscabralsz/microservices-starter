import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException, ValidationException } from '../../../kernel/exceptions/domain.exception';

/**
 * Global Exception Filter
 * Converts domain exceptions to HTTP responses
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    this.logger.warn(`Domain Exception: ${exception.code} - ${exception.message}`, {
      url: request.url,
      method: request.method,
      code: exception.code,
      statusCode: exception.statusCode
    });

    const statusCode = exception.statusCode || HttpStatus.BAD_REQUEST;

    if (exception instanceof ValidationException) {
      return response.status(statusCode).json({
        success: false,
        error: {
          code: exception.code,
          message: exception.message,
          errors: exception.errors
        }
      });
    }

    response.status(statusCode).json({
      success: false,
      error: {
        code: exception.code,
        message: exception.message
      }
    });
  }
}
