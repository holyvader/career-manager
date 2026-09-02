/// <reference types="bun-types" />
import { afterEach, describe, expect, it, mock } from 'bun:test';

describe('verifySession (has session)', () => {
  afterEach(() => {
    mock.restore();
  });

  it('returns the session without redirecting', async () => {
    const fakeSession = {
      user: {
        id: 'u1',
        email: 'u1@example.test',
        emailVerified: true,
        name: 'Test User',
        image: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      session: {
        id: 's1',
        token: 'token',
        userId: 'u1',
        expiresAt: '2026-01-02T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    };

    mock.module('next/navigation', () => ({
      redirect: () => {
        throw new Error('should not redirect when a session exists');
      },
    }));
    mock.module('@/lib/get-session', () => ({
      getSession: async () => fakeSession,
    }));

    const { verifySession } = await import('./dal');
    await expect(verifySession()).resolves.toEqual(fakeSession);
  });
});
