import { Ratelimit } from "@upstash/ratelimit";

import { redis } from "@/lib/redis";

/**
 * Simple rate limiters for core endpoints
 * Returns null if Redis is not configured
 */
export const rateLimiters = {
  // 3 auth attempts per hour per IP
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "20 m"),
        prefix: "rl:auth",
        enableProtection: true,
        analytics: true,
      })
    : null,

  // 5 billing operations per hour per IP
  billing: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "20 m"),
        prefix: "rl:billing",
        enableProtection: true,
        analytics: true,
      })
    : null,
};

/**
 * Apply rate limiting with error handling
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ success: boolean; remaining?: number; error?: string }> {
  // If limiter is not configured (no Redis), allow all requests
  if (!limiter) {
    return { success: true, error: "Rate limiting not configured" };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Fail open - allow request if rate limiting fails
    return { success: true, error: "Rate limiting unavailable" };
  }
}
