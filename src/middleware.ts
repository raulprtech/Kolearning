import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Ratelimit if credentials are available
let ratelimit: Ratelimit | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    ratelimit = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per 60 seconds
      analytics: true,
      prefix: '@upstash/ratelimit',
    });
  }
} catch (e) {
  console.warn('⚠️ Rate limiting initialization failed:', e);
}

// Simple in-memory fallback for local development or missing keys
const memoryCache = new Map<string, { count: number; expires: number }>();

async function checkRateLimit(ip: string) {
  if (ratelimit) {
    return await ratelimit.limit(ip);
  }
  
  // Fallback implementation
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = 15; // Slightly more generous for fallback
  
  const record = memoryCache.get(ip);
  if (!record || record.expires < now) {
    memoryCache.set(ip, { count: 1, expires: now + windowMs });
    return { success: true, remaining: limit - 1, limit, reset: now + windowMs };
  }
  
  if (record.count >= limit) {
    return { success: false, remaining: 0, limit, reset: record.expires };
  }
  
  record.count++;
  return { success: true, remaining: limit - record.count, limit, reset: record.expires };
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Apply rate limiting to AI and extraction endpoints
  if (path.startsWith('/api/ai/') || path.startsWith('/api/extract')) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : (request as any).ip ?? '127.0.0.1';
    const { success, limit, remaining, reset } = await checkRateLimit(`ratelimit_${path}_${ip}`);
    
    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }
  }

  // Update user session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}