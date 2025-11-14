/**
 * Security Utilities
 * Provides security headers, CORS, rate limiting readiness, and other security features
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Security Headers for all responses
 */
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'",
} as const;

/**
 * Apply security headers to response
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * CORS Configuration
 */
export const CORS_CONFIG = {
  allowedOrigins: process.env.NODE_ENV === 'production'
    ? ['https://your-production-domain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return CORS_CONFIG.allowedOrigins.includes(origin);
}

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (isOriginAllowed(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '*');
    response.headers.set('Access-Control-Allow-Methods', CORS_CONFIG.allowedMethods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', CORS_CONFIG.allowedHeaders.join(', '));
    response.headers.set('Access-Control-Max-Age', CORS_CONFIG.maxAge.toString());
    if (CORS_CONFIG.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }
  return response;
}

/**
 * Rate Limiting (implements token bucket algorithm)
 * In production, use Redis for distributed rate limiting
 */
class RateLimiter {
  private store = new Map<string, { tokens: number; lastRefill: number }>();
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per minute

  constructor(maxTokens: number = 60, refillRatePerMinute: number = 60) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRatePerMinute / 60000; // Convert to per millisecond
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    let bucket = this.store.get(key);

    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.store.set(key, bucket);
    }

    // Refill tokens based on time passed
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }
}

export const rateLimiter = new RateLimiter(60, 60); // 60 requests per minute

/**
 * Get client IP address
 */
export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"'&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;',
    };
    return entities[char] || char;
  });
}

/**
 * Validate URL is safe
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, 'http://localhost');
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// --- Fintech-grade request integrity helpers ------------------------------

const DEV_ALLOWED = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);

export function getRequestOrigin(req: Request): string | null {
  const h = req.headers;
  return (
    h.get("origin") ||
    h.get("x-forwarded-origin") ||
    null
  );
}

export function isAllowedOrigin(req: Request): boolean {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "";
  const origin = getRequestOrigin(req);
  if (!origin) return true; // same-origin fetch or non-browser client
  if (configured && origin === configured) return true;
  if (process.env.NODE_ENV !== "production" && DEV_ALLOWED.has(origin)) return true;
  try {
    const referer = req.headers.get("referer");
    if (referer && configured && new URL(referer).origin === new URL(configured).origin) return true;
  } catch {}
  return false;
}

export function requireAllowedOrigin(req: Request) {
  if (!isAllowedOrigin(req)) {
    const err: any = new Error("Forbidden origin");
    err.statusCode = 403;
    throw err;
  }
}

export function getIdempotencyKey(req: Request): string | null {
  const h = req.headers;
  return (
    h.get("idempotency-key") ||
    h.get("Idempotency-Key") ||
    h.get("x-idempotency-key") ||
    null
  );
}
