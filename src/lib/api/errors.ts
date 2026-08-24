/**
 * Typed API errors for /api/v1. Thrown inside handlers and converted to safe
 * structured JSON by `handleApi` — clients never see stack traces or internals.
 */
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'TOTP_REQUIRED'
  | 'INTERNAL';

const STATUS: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  TOTP_REQUIRED: 401,
  INTERNAL: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: Record<string, string>;
  readonly retryAfterSeconds?: number;

  constructor(
    code: ApiErrorCode,
    message: string,
    opts?: { details?: Record<string, string>; retryAfterSeconds?: number },
  ) {
    super(message);
    this.code = code;
    this.status = STATUS[code];
    this.details = opts?.details;
    this.retryAfterSeconds = opts?.retryAfterSeconds;
  }
}

export const badRequest = (msg = 'Invalid request.') => new ApiError('BAD_REQUEST', msg);
export const unauthorized = (msg = 'Authentication required.') => new ApiError('UNAUTHORIZED', msg);
export const forbidden = (msg = 'Not allowed.') => new ApiError('FORBIDDEN', msg);
export const notFound = (msg = 'Not found.') => new ApiError('NOT_FOUND', msg);
export const validationError = (details: Record<string, string>, msg = 'Please check the highlighted fields.') =>
  new ApiError('VALIDATION_ERROR', msg, { details });
export const rateLimited = (retryAfterSeconds: number) =>
  new ApiError('RATE_LIMITED', 'Too many requests. Please try again later.', { retryAfterSeconds });
