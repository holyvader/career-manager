import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { tagRoutes } from './tag';
import {
  createTestUser,
  deleteTestUser,
  jsonRequest,
  postJson,
  type TestUser,
} from './testUtils';

describe('tag routes', () => {
  let userA: TestUser;
  let userB: TestUser;

  beforeAll(async () => {
    userA = await createTestUser('tag-test-a');
    userB = await createTestUser('tag-test-b');
  });

  afterAll(async () => {
    await deleteTestUser(userA.id);
    await deleteTestUser(userB.id);
  });

  describe('authGuard', () => {
    it('rejects unauthenticated GET /tags', async () => {
      const res = await jsonRequest(tagRoutes, '/tags');
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated POST /tags', async () => {
      const res = await postJson(tagRoutes, '/tags', { name: 'x' });
      expect(res.status).toBe(401);
    });

    it('rejects an unauthenticated request bearing garbage cookie', async () => {
      const res = await jsonRequest(tagRoutes, '/tags', {
        cookie: 'better-auth.session_token=not-a-real-token',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('ownership on create/list', () => {
    it('lets a user create and then list their own tag', async () => {
      const create = await postJson(
        tagRoutes,
        '/tags',
        { name: 'integration-tag' },
        userA.cookie,
      );
      expect(create.status).toBe(200);
      const created = (await create.json()) as { authorId: string };
      expect(created.authorId).toBe(userA.id);

      const list = await jsonRequest(tagRoutes, '/tags', {
        cookie: userA.cookie,
      });
      expect(list.status).toBe(200);
      const tags = (await list.json()) as Array<{ name: string }>;
      expect(tags.some((t) => t.name === 'integration-tag')).toBe(true);
    });

    it("does not leak another user's tags into the list", async () => {
      await postJson(
        tagRoutes,
        '/tags',
        { name: 'user-b-only-tag' },
        userB.cookie,
      );

      const list = await jsonRequest(tagRoutes, '/tags', {
        cookie: userA.cookie,
      });
      const tags = (await list.json()) as Array<{ name: string }>;
      expect(tags.some((t) => t.name === 'user-b-only-tag')).toBe(false);
    });

    it('allows two different users to have a tag with the same name', async () => {
      const a = await postJson(
        tagRoutes,
        '/tags',
        { name: 'shared-name' },
        userA.cookie,
      );
      const b = await postJson(
        tagRoutes,
        '/tags',
        { name: 'shared-name' },
        userB.cookie,
      );
      expect(a.status).toBe(200);
      expect(b.status).toBe(200);
    });

    it('rejects creating a duplicate tag name for the same user with 409', async () => {
      await postJson(tagRoutes, '/tags', { name: 'dup-name' }, userA.cookie);
      const dup = await postJson(
        tagRoutes,
        '/tags',
        { name: 'dup-name' },
        userA.cookie,
      );
      expect(dup.status).toBe(409);
    });
  });

  describe('GET /tag/:id', () => {
    it("returns 404 for another user's tag (no existence leak)", async () => {
      const create = await postJson(
        tagRoutes,
        '/tags',
        { name: 'b-private-tag' },
        userB.cookie,
      );
      const { id } = (await create.json()) as { id: string };

      const asOwner = await jsonRequest(tagRoutes, `/tag/${id}`, {
        cookie: userB.cookie,
      });
      expect(asOwner.status).toBe(200);

      const asOther = await jsonRequest(tagRoutes, `/tag/${id}`, {
        cookie: userA.cookie,
      });
      expect(asOther.status).toBe(404);
    });
  });

  describe('POST /tag/connect (IDOR checks)', () => {
    it('rejects connecting to a tag owned by someone else', async () => {
      const bTag = await postJson(
        tagRoutes,
        '/tags',
        { name: 'connect-guard-tag' },
        userB.cookie,
      );
      const { id: bTagId } = (await bTag.json()) as { id: string };

      const res = await postJson(
        tagRoutes,
        '/tag/connect',
        { tagId: bTagId, jobOffers: [] },
        userA.cookie,
      );
      expect(res.status).toBe(403);
    });

    it("rejects connecting someone else's job offer to your own tag", async () => {
      // Seed a job offer for userB directly (no creation endpoint lives in
      // tagRoutes/meRoutes' test surface here - insert via prisma like the
      // app itself would after a real /me/offers POST).
      const { prisma } = await import('../../db/prismaClient');
      const offer = await prisma.jobOffer.create({
        data: { title: 'B offer', participantId: userB.id },
      });

      const aTag = await postJson(
        tagRoutes,
        '/tags',
        { name: 'my-own-tag' },
        userA.cookie,
      );
      const { id: aTagId } = (await aTag.json()) as { id: string };

      const res = await postJson(
        tagRoutes,
        '/tag/connect',
        { tagId: aTagId, jobOffers: [offer.id] },
        userA.cookie,
      );
      expect(res.status).toBe(403);
    });

    it('allows connecting your own job offer to your own tag', async () => {
      const { prisma } = await import('../../db/prismaClient');
      const offer = await prisma.jobOffer.create({
        data: { title: 'A offer', participantId: userA.id },
      });

      const tag = await postJson(
        tagRoutes,
        '/tags',
        { name: 'legit-connect-tag' },
        userA.cookie,
      );
      const { id: tagId } = (await tag.json()) as { id: string };

      const res = await postJson(
        tagRoutes,
        '/tag/connect',
        { tagId, jobOffers: [offer.id] },
        userA.cookie,
      );
      expect(res.status).toBe(200);
    });
  });
});
