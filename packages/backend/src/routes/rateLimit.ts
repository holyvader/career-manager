// better-auth's own rate-limit middleware only runs for requests dispatched
// through its mounted HTTP router (auth.handler) - it never fires for direct
// auth.api.*() calls, which is what authRpc.ts uses so these routes can be
// typed for Eden Treaty. Verified directly: hammering /auth/signIn (our
// wrapper) never triggers a 429, while hammering the same request against
// the still-mounted /api/auth/sign-in/email does. So the sensitive routes
// need their own limiter - this one, applied in authRpc.ts.
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function getClientKey(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  );
}

// Fixed-window limiter, in-memory. Only tracks state within this single
// process - if this ever runs as more than one instance, back it with
// shared storage (e.g. Redis) instead, same caveat as better-auth's own
// default "memory" rate-limit storage.
export function isRateLimited(
  request: Request,
  routeName: string,
  { windowMs, max }: { windowMs: number; max: number },
): boolean {
  const key = `${routeName}:${getClientKey(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}
