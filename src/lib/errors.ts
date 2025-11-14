/**
 * Centralized Error Handling
 * Provides consistent error handling across API routes
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';
import { ApiResponseBuilder, HTTP_STATUS, ERROR_CODES } from './api';

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ERROR_CODES.VALIDATION_ERROR, message, HTTP_STATUS.BAD_REQUEST, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(ERROR_CODES.INVALID_CREDENTIALS, message, HTTP_STATUS.UNAUTHORIZED);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(ERROR_CODES.INSUFFICIENT_PERMISSIONS, message, HTTP_STATUS.FORBIDDEN);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(ERROR_CODES.NOT_FOUND, `${resource} not found`, HTTP_STATUS.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super('CONFLICT', message, HTTP_STATUS.CONFLICT);
    this.name = 'ConflictError';
  }
}

export class BusinessLogicError extends AppError {
  constructor(code: string, message: string, details?: any) {
    super(code, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, details);
    this.name = 'BusinessLogicError';
  }
}

/**
 * Handle API errors and return standardized response
 */
export function handleApiError(error: unknown, requestId?: string) {
  if (error instanceof AppError) {
    logger.warn(`[${error.name}] ${error.message}`, { requestId, code: error.code });
    return NextResponse.json(
      ApiResponseBuilder.error(error.code, error.message, error.details, requestId),
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    logger.error(`[UnhandledError] ${error.message}`, error, { requestId });
    return NextResponse.json(
      ApiResponseBuilder.internalError('An unexpected error occurred', requestId),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }

  logger.error('[UnknownError] Unknown error occurred', undefined, { requestId });
  return NextResponse.json(
    ApiResponseBuilder.internalError('An unexpected error occurred', requestId),
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
  );
}

/**
 * Validate required fields in request body
 */
export function validateRequired(
  data: Record<string, any>,
  required: string[]
): { isValid: boolean; errors?: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of required) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors[field] = `${field} is required`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate request ID for tracking
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
