// Simple in-memory rate limiter suitable for dev/demo.
// Not for production across multiple instances.

type Key = string;

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets: Map<Key, Bucket> = (globalThis as any).__rl__ || new Map();
if (!(globalThis as any).__rl__) (globalThis as any).__rl__ = buckets;

export function rateLimit({ key, tokensPerInterval, intervalMs }: {
  key: Key;
  tokensPerInterval: number;
  intervalMs: number;
}): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) || { tokens: tokensPerInterval, lastRefill: now };

  // Refill
  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const refill = Math.floor(elapsed / intervalMs) * tokensPerInterval;
    bucket.tokens = Math.min(tokensPerInterval, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}

export function keyForRequest(req: Request, userId?: string) {
  if (userId) return `u:${userId}`;
  try {
    // @ts-ignore - NextRequest has ip
    const ip = (req as any).ip || (req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown");
    return `ip:${ip}`;
  } catch {
    return "ip:unknown";
  }
}
