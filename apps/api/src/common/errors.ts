import { HttpException, HttpStatus } from '@nestjs/common';
import { errorMessagesTr, type ErrorCode } from '@merak/contracts';

const statusByCode: Record<ErrorCode, HttpStatus> = {
  AUTH_REQUIRED: HttpStatus.UNAUTHORIZED,
  AUTH_INVALID_TOKEN: HttpStatus.UNAUTHORIZED,
  AUTH_TOKEN_EXPIRED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  VALIDATION_FAILED: HttpStatus.BAD_REQUEST,
  RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  PAYLOAD_TOO_LARGE: HttpStatus.PAYLOAD_TOO_LARGE,
  USERNAME_TAKEN: HttpStatus.CONFLICT,
  CONTENT_NOT_PUBLISHED: HttpStatus.NOT_FOUND,
  SESSION_NOT_JOINABLE: HttpStatus.CONFLICT,
  SESSION_CANCELLED: HttpStatus.CONFLICT,
  SESSION_COMPLETED: HttpStatus.CONFLICT,
  PARTICIPATION_EXISTS: HttpStatus.CONFLICT,
  PARTICIPATION_TOKEN_INVALID: HttpStatus.FORBIDDEN,
  NOT_PARTICIPANT: HttpStatus.FORBIDDEN,
  QUESTION_NOT_OPEN: HttpStatus.CONFLICT,
  QUESTION_CLOSED: HttpStatus.CONFLICT,
  NOT_ELIGIBLE_FOR_QUESTION: HttpStatus.CONFLICT,
  ANSWER_ALREADY_ACCEPTED: HttpStatus.CONFLICT,
  IDEMPOTENCY_KEY_CONFLICT: HttpStatus.CONFLICT,
  OPTION_INVALID: HttpStatus.BAD_REQUEST,
  QUESTION_NOT_APPROVED: HttpStatus.CONFLICT,
  QUESTION_COUNT_INVALID: HttpStatus.BAD_REQUEST,
  INVALID_TRANSITION: HttpStatus.CONFLICT,
  REVISION_STALE: HttpStatus.CONFLICT,
  SCHEDULE_IN_PAST: HttpStatus.BAD_REQUEST,
  SCHEDULER_NOT_LEADER: HttpStatus.SERVICE_UNAVAILABLE,
  INTERNAL: HttpStatus.INTERNAL_SERVER_ERROR,
};

export class AppError extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    message?: string,
    public readonly details?: unknown,
  ) {
    super({ code, message: message ?? errorMessagesTr[code], details }, statusByCode[code]);
  }
}

/** Finds the underlying PostgreSQL error (drizzle wraps driver errors in DrizzleQueryError.cause). */
export function pgError(err: unknown): { code?: string; constraint?: string } | null {
  let cur = err as { code?: string; constraint?: string; cause?: unknown } | undefined;
  for (let depth = 0; cur && depth < 5; depth++) {
    if (typeof cur.code === 'string' && /^[0-9A-Z]{5}$/.test(cur.code)) return cur;
    cur = cur.cause as typeof cur;
  }
  return null;
}

export function isPgUniqueViolation(err: unknown, constraint?: string): boolean {
  const e = pgError(err);
  if (!e || e.code !== '23505') return false;
  return constraint ? e.constraint === constraint : true;
}
