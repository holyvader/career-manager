import { describe, expect, it } from 'bun:test';
import { isRateLimited } from './rateLimit';

function requestFrom(ip: string) {
  return new Request('http://localhost/test', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('isRateLimited', () => {
  it('allows requests up to the limit', () => {
    const ip = '10.0.0.1';
    const opts = { windowMs: 10_000, max: 3 };
    expect(isRateLimited(requestFrom(ip), 'unit-a', opts)).toBe(false);
    expect(isRateLimited(requestFrom(ip), 'unit-a', opts)).toBe(false);
    expect(isRateLimited(requestFrom(ip), 'unit-a', opts)).toBe(false);
  });

  it('blocks once the limit is exceeded within the window', () => {
    const ip = '10.0.0.2';
    const opts = { windowMs: 10_000, max: 3 };
    isRateLimited(requestFrom(ip), 'unit-b', opts);
    isRateLimited(requestFrom(ip), 'unit-b', opts);
    isRateLimited(requestFrom(ip), 'unit-b', opts);
    expect(isRateLimited(requestFrom(ip), 'unit-b', opts)).toBe(true);
  });

  it('tracks different routes independently for the same client', () => {
    const ip = '10.0.0.3';
    const opts = { windowMs: 10_000, max: 1 };
    expect(isRateLimited(requestFrom(ip), 'unit-c-route-1', opts)).toBe(false);
    // Same IP, different route name -> separate bucket, not blocked.
    expect(isRateLimited(requestFrom(ip), 'unit-c-route-2', opts)).toBe(false);
  });

  it('tracks different clients independently for the same route', () => {
    const opts = { windowMs: 10_000, max: 1 };
    expect(isRateLimited(requestFrom('10.0.0.4'), 'unit-d', opts)).toBe(false);
    expect(isRateLimited(requestFrom('10.0.0.5'), 'unit-d', opts)).toBe(false);
  });

  it('resets after the window elapses', async () => {
    const ip = '10.0.0.6';
    const opts = { windowMs: 50, max: 1 };
    expect(isRateLimited(requestFrom(ip), 'unit-e', opts)).toBe(false);
    expect(isRateLimited(requestFrom(ip), 'unit-e', opts)).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(isRateLimited(requestFrom(ip), 'unit-e', opts)).toBe(false);
  });

  it('falls back to a shared key when no IP header is present', () => {
    const opts = { windowMs: 10_000, max: 1 };
    const noIpRequest = () => new Request('http://localhost/test');
    expect(isRateLimited(noIpRequest(), 'unit-f', opts)).toBe(false);
    expect(isRateLimited(noIpRequest(), 'unit-f', opts)).toBe(true);
  });
});
