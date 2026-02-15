/**
 * Base API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

/**
 * API error structure
 */
export interface ApiError {
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * Common HTTP error types
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(400, message, details);
    this.name = 'BadRequestError';
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(503, message);
    this.name = 'ServiceUnavailableError';
  }
}
