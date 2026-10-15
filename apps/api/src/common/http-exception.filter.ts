import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ThrottlerException } from '@nestjs/throttler';
import { errorMessagesTr, type ApiError, type ErrorCode } from '@merak/contracts';
import { Logger } from 'nestjs-pino';
import { AppError } from './errors.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();
    const requestId = (req as any)?.id ? String((req as any).id) : undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = 'INTERNAL';
    let message = errorMessagesTr.INTERNAL;
    let details: unknown;

    if (exception instanceof AppError) {
      status = exception.getStatus();
      code = exception.code;
      message = (exception.getResponse() as { message: string }).message;
      details = exception.details;
    } else if (exception instanceof ThrottlerException) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      code = 'RATE_LIMITED';
      message = errorMessagesTr.RATE_LIMITED;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      if (status === HttpStatus.NOT_FOUND) code = 'NOT_FOUND';
      else if (status === HttpStatus.UNAUTHORIZED) code = 'AUTH_REQUIRED';
      else if (status === HttpStatus.FORBIDDEN) code = 'FORBIDDEN';
      else if (status === HttpStatus.PAYLOAD_TOO_LARGE) code = 'PAYLOAD_TOO_LARGE';
      else if (status === HttpStatus.BAD_REQUEST) code = 'VALIDATION_FAILED';
      else if (status >= 500) code = 'INTERNAL';
      else code = 'VALIDATION_FAILED';
      message = errorMessagesTr[code];
      const body = exception.getResponse();
      details = typeof body === 'object' ? (body as any).message : undefined;
    } else if ((exception as any)?.type === 'entity.too.large') {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      code = 'PAYLOAD_TOO_LARGE';
      message = errorMessagesTr.PAYLOAD_TOO_LARGE;
    } else if ((exception as any)?.type === 'entity.parse.failed') {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_FAILED';
      message = errorMessagesTr.VALIDATION_FAILED;
    }

    if (status >= 500) {
      this.logger.error(
        { err: exception, requestId, path: req?.url },
        'unhandled exception',
        'AllExceptionsFilter',
      );
    }

    const payload: ApiError = { error: { code, message, details, requestId } };
    res.status(status).json(payload);
  }
}
