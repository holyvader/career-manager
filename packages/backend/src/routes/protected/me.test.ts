import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { prisma } from '../../db/prismaClient';
import { meRoutes } from './me';
import {
  createTestUser,
  deleteTestUser,
  jsonRequest,
  patchJson,
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

    it('returns an empty array (not 404) when the caller has no offers', async () => {
      const empty = await createTestUser('me-test-empty');
      const res = await jsonRequest(meRoutes, '/me/offers', {
        cookie: empty.cookie,
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
      await deleteTestUser(empty.id);
    });
  });

  describe('GET /me/offers/:id', () => {
    it("returns 404 for another user's offer (no existence leak)", async () => {
      const offer = await prisma.jobOffer.create({
        data: { title: 'B private offer', participantId: userB.id },
      });

      const asOwner = await jsonRequest(meRoutes, `/me/offers/${offer.id}`, {
        cookie: userB.cookie,
      });
      expect(asOwner.status).toBe(200);

      const asOther = await jsonRequest(meRoutes, `/me/offers/${offer.id}`, {
        cookie: userA.cookie,
      });
      expect(asOther.status).toBe(404);
    });

    it('defaults a newly created offer to STARTED', async () => {
      const create = await postJson(
        meRoutes,
        '/me/offers',
        { title: 'Default status offer' },
        userA.cookie,
      );
      const { id } = (await create.json()) as { id: string };

      const res = await jsonRequest(meRoutes, `/me/offers/${id}`, {
        cookie: userA.cookie,
      });
      const body = (await res.json()) as { status: string };
      expect(body.status).toBe('STARTED');
    });
  });

  describe('PATCH /me/offers/:id', () => {
    it("rejects updating another user's offer", async () => {
      const offer = await prisma.jobOffer.create({
        data: { title: 'B offer to protect', participantId: userB.id },
      });

      const res = await patchJson(
        meRoutes,
        `/me/offers/${offer.id}`,
        { status: 'HIRED' },
        userA.cookie,
      );
      expect(res.status).toBe(404);
    });

    it('lets the owner update status and fields', async () => {
      const create = await postJson(
        meRoutes,
        '/me/offers',
        { title: 'Offer to update' },
        userA.cookie,
      );
      const { id } = (await create.json()) as { id: string };

      const res = await patchJson(
        meRoutes,
        `/me/offers/${id}`,
        { title: 'Updated title', status: 'IN_PROGRESS' },
        userA.cookie,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { title: string; status: string };
      expect(body.title).toBe('Updated title');
      expect(body.status).toBe('IN_PROGRESS');
    });
  });

  describe('PATCH /me (profile)', () => {
    it('updates profile fields and keeps `name` in sync', async () => {
      const res = await patchJson(
        meRoutes,
        '/me',
        {
          firstName: 'Ada',
          lastName: 'Lovelace',
          resumeLink: 'https://example.test/resume.pdf',
          links: [{ label: 'GitHub', url: 'https://github.com/example' }],
        },
        userA.cookie,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        first_name: string;
        last_name: string;
        name: string;
        resume_link: string;
        links: Array<{ label: string; url: string }>;
      };
      expect(body.first_name).toBe('Ada');
      expect(body.last_name).toBe('Lovelace');
      expect(body.name).toBe('Ada Lovelace');
      expect(body.resume_link).toBe('https://example.test/resume.pdf');
      expect(body.links).toEqual([
        { label: 'GitHub', url: 'https://github.com/example' },
      ]);
    });

    it('leaves `name` untouched when neither first nor last name is sent', async () => {
      const before = await jsonRequest(meRoutes, '/me', {
        cookie: userB.cookie,
      });
      const beforeBody = (await before.json()) as { name: string };

      const res = await patchJson(
        meRoutes,
        '/me',
        { resumeLink: 'https://example.test/other-resume.pdf' },
        userB.cookie,
      );
      const body = (await res.json()) as { name: string };
      expect(body.name).toBe(beforeBody.name);
    });
  });
});
