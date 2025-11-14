/**
 * Standardized API Response Structures
 * Ensures all API endpoints return consistent response formats
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export class ApiResponseBuilder {
  static success<T>(data: T, requestId?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
  }

  static error(code: string, message: string, details?: any, requestId?: string): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details: process.env.NODE_ENV === 'production' ? undefined : details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    };
  }

  static validationError(message: string, details?: any, requestId?: string): ApiResponse {
    return this.error('VALIDATION_ERROR', message, details, requestId);
  }

  static authenticationError(message: string = 'Unauthorized', requestId?: string): ApiResponse {
    return this.error('AUTHENTICATION_ERROR', message, undefined, requestId);
  }

  static authorizationError(message: string = 'Forbidden', requestId?: string): ApiResponse {
    return this.error('AUTHORIZATION_ERROR', message, undefined, requestId);
  }

  static notFoundError(resource: string, requestId?: string): ApiResponse {
    return this.error('NOT_FOUND', `${resource} not found`, undefined, requestId);
  }

  static internalError(message: string = 'Internal server error', requestId?: string): ApiResponse {
    return this.error('INTERNAL_ERROR', message, undefined, requestId);
  }
}

/**
 * HTTP Status Code Mappings
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error Codes for Client Handling
 */
export const ERROR_CODES = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Authorization
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Business Logic
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  ENCRYPTION_ERROR: 'ENCRYPTION_ERROR',
} as const;
