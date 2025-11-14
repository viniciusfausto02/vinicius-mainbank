/**
 * Shared Type Definitions
 * Ensures type safety and consistency across the application
 */

import { Session } from 'next-auth';

/**
 * Extended NextAuth Session with user metadata
 */
export interface AppSession extends Session {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    emailVerified: Date | null;
  };
}

/**
 * User Roles for RBAC
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

/**
 * API Request Context
 */
export interface ApiContext {
  session: AppSession | null;
  userId?: string;
  requestId: string;
}

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Account Types
 */
export interface AccountData {
  id: string;
  userId: string;
  name: string;
  balance: number;
  encryptedAccountNumber?: string;
  encryptedRoutingNumber?: string;
  accountNumberHash?: string;
  routingNumberHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionData {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
}

/**
 * Audit Log Entry
 */
export interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

/**
 * Form Validation Error
 */
export interface FormErrors {
  [key: string]: string | string[];
}

/**
 * Query Options
 */
export interface QueryOptions {
  select?: string[];
  where?: Record<string, any>;
  orderBy?: string;
  limit?: number;
  offset?: number;
}
