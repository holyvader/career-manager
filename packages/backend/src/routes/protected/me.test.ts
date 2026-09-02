import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { prisma } from '../../db/prismaClient';
import { meRoutes } from './me';
import {
  createTestUser,
  deleteTestUser,
  jsonRequest,
  postJson,
  type TestUser,
} from './testUtils';

describe('me routes', () => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    userA = await createTestUser('me-test-a');
    userB = await createTestUser('me-test-b');
  });

  afterAll(async () => {
    await deleteTestUser(userA.id);
    await deleteTestUser(userB.id);
  });

  describe('authGuard', () => {
    it('rejects unauthenticated GET /me', async () => {
      const res = await jsonRequest(meRoutes, '/me');
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated GET /me/offers', async () => {
      const res = await jsonRequest(meRoutes, '/me/offers');
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated POST /me/offers', async () => {
      const res = await postJson(meRoutes, '/me/offers', {
        title: 'x',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /me', () => {
    it("returns only the caller's own user record", async () => {
      const res = await jsonRequest(meRoutes, '/me', { cookie: userA.cookie });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { id: string; email: string };
      expect(body.id).toBe(userA.id);
      expect(body.email).toBe(userA.email);
    });
  });

  describe('POST /me/offers', () => {
    it('creates a job offer owned by the caller', async () => {
      const res = await postJson(
        meRoutes,
        '/me/offers',
        { title: 'Backend Engineer' },
        userA.cookie,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        id: string;
        participantId: string;
      };
      expect(body.participantId).toBe(userA.id);
    });
  });

  describe('GET /me/offers (ownership)', () => {
    it("does not leak another user's job offers", async () => {
      await prisma.jobOffer.create({
        data: { title: 'B secret offer', participantId: userB.id },
      });

      const res = await jsonRequest(meRoutes, '/me/offers', {
        cookie: userA.cookie,
      });
      expect(res.status).toBe(200);
      const offers = (await res.json()) as Array<{ title: string }>;
      expect(offers.some((o) => o.title === 'B secret offer')).toBe(false);
    });

    it("returns the caller's own offers", async () => {
      const res = await jsonRequest(meRoutes, '/me/offers', {
        cookie: userB.cookie,
      });
      expect(res.status).toBe(200);
      const offers = (await res.json()) as Array<{ title: string }>;
      expect(offers.some((o) => o.title === 'B secret offer')).toBe(true);
    });
  });
});
