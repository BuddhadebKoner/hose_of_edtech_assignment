type RateLimitEntry = {
   count: number;
   resetAt: number;
};

const cache = new Map<string, RateLimitEntry>();

export type RateLimitResult = {
   ok: boolean;
   remaining: number;
   resetAt: number;
   retryAfter: number;
};

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
   const now = Date.now();
   const entry = cache.get(key);

   if (!entry || now > entry.resetAt) {
      const resetAt = now + windowMs;
      cache.set(key, { count: 1, resetAt });
      return {
         ok: true,
         remaining: Math.max(limit - 1, 0),
         resetAt,
         retryAfter: Math.ceil(windowMs / 1000),
      };
   }

   if (entry.count >= limit) {
      return {
         ok: false,
         remaining: 0,
         resetAt: entry.resetAt,
         retryAfter: Math.max(Math.ceil((entry.resetAt - now) / 1000), 1),
      };
   }

   entry.count += 1;

   return {
      ok: true,
      remaining: Math.max(limit - entry.count, 0),
      resetAt: entry.resetAt,
      retryAfter: Math.max(Math.ceil((entry.resetAt - now) / 1000), 1),
   };
}

export function getClientIp(req: Request) {
   const forwardedFor = req.headers.get("x-forwarded-for");
   if (forwardedFor) {
      return forwardedFor.split(",")[0]?.trim() ?? "unknown";
   }

   const realIp = req.headers.get("x-real-ip");
   if (realIp) {
      return realIp.trim();
   }

   return "unknown";
}
