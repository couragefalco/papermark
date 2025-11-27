import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;
export const redis = (() => {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      return null as any; // Return null but cast to maintain type compatibility
    }
    _redis = new Redis({ url, token });
  }
  return _redis;
})();

let _lockerRedisClient: Redis | null = null;
export const lockerRedisClient = (() => {
  if (!_lockerRedisClient) {
    const url = process.env.UPSTASH_REDIS_REST_LOCKER_URL;
    const token = process.env.UPSTASH_REDIS_REST_LOCKER_TOKEN;
    if (!url || !token) {
      return null as any; // Return null but cast to maintain type compatibility
    }
    _lockerRedisClient = new Redis({ url, token });
  }
  return _lockerRedisClient;
})();

// Create a new ratelimiter, that allows 10 requests per 10 seconds by default
export const ratelimit = (
  requests: number = 10,
  seconds:
    | `${number} ms`
    | `${number} s`
    | `${number} m`
    | `${number} h`
    | `${number} d` = "10 s",
) => {
  if (!redis) {
    return null as any; // Return null but cast for type compatibility
  }
  return new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(requests, seconds),
    analytics: true,
    prefix: "papermark",
  });
};
