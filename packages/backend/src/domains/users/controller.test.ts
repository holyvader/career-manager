import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { prisma } from '../../db/prismaClient';
import { meRoutes } from '../../routes/me';
import {
  createTestUser,
  deleteTestUser,
  jsonRequest,
  patchJson,
  postJson,
  type TestUser,
} from '../../testing/testUtils';

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

  describe('offer detail fields', () => {
    it('round-trips new detail fields through create/update', async () => {
      const create = await postJson(
        meRoutes,
        '/me/offers',
        {
          title: 'Offer with details',
          companyName: 'Acme',
          location: 'Warsaw',
          remoteType: 'HYBRID',
          seniority: 'SENIOR',
          rate: '20-25k PLN/mo',
          availability: 'Immediate',
          contractType: ['B2B', 'EMPLOYMENT_CONTRACT'],
        },
        userA.cookie,
      );
      expect(create.status).toBe(200);
      const created = (await create.json()) as {
        id: string;
        companyName: string;
        location: string;
        remoteType: string;
        seniority: string;
        rate: string;
        availability: string;
        contractType: string[];
      };
      expect(created.companyName).toBe('Acme');
      expect(created.location).toBe('Warsaw');
      expect(created.remoteType).toBe('HYBRID');
      expect(created.seniority).toBe('SENIOR');
      expect(created.rate).toBe('20-25k PLN/mo');
      expect(created.availability).toBe('Immediate');
      expect([...created.contractType].sort()).toEqual(
        ['B2B', 'EMPLOYMENT_CONTRACT'].sort(),
      );

      const update = await patchJson(
        meRoutes,
        `/me/offers/${created.id}`,
        { companyName: 'Acme Corp', contractType: ['INTERNSHIP'] },
        userA.cookie,
      );
      const updated = (await update.json()) as {
        companyName: string;
        contractType: string[];
      };
      expect(updated.companyName).toBe('Acme Corp');
      expect(updated.contractType).toEqual(['INTERNSHIP']);
    });
  });

  describe('GET /me/offers filtering and sorting', () => {
    it('filters by q across title/content/companyName/location, filters by contractType (OR), and sorts by createdAt', async () => {
      const user = await createTestUser('me-test-filters');

      await postJson(
        meRoutes,
        '/me/offers',
        {
          title: 'Frontend role',
          companyName: 'Widgets Inc',
          contractType: ['B2B'],
        },
        user.cookie,
      );
      await postJson(
        meRoutes,
        '/me/offers',
        {
          title: 'Backend role',
          companyName: 'Gadgets Ltd',
          location: 'Krakow',
          contractType: ['EMPLOYMENT_CONTRACT'],
        },
        user.cookie,
      );
      await postJson(
        meRoutes,
        '/me/offers',
        {
          title: 'Data role',
          content: 'search for widgets everywhere',
          contractType: ['INTERNSHIP'],
        },
        user.cookie,
      );

      const byTitle = await jsonRequest(meRoutes, '/me/offers?q=Frontend', {
        cookie: user.cookie,
      });
      const byTitleOffers = (await byTitle.json()) as Array<{ title: string }>;
      expect(byTitleOffers.map((o) => o.title)).toEqual(['Frontend role']);

      const byCompany = await jsonRequest(meRoutes, '/me/offers?q=Gadgets', {
        cookie: user.cookie,
      });
      const byCompanyOffers = (await byCompany.json()) as Array<{
        title: string;
      }>;
      expect(byCompanyOffers.map((o) => o.title)).toEqual(['Backend role']);

      const byContent = await jsonRequest(meRoutes, '/me/offers?q=widgets', {
        cookie: user.cookie,
      });
      const byContentOffers = (await byContent.json()) as Array<{
        title: string;
      }>;
      expect(byContentOffers.map((o) => o.title).sort()).toEqual(
        ['Data role', 'Frontend role'].sort(),
      );

      const byContract = await jsonRequest(
        meRoutes,
        '/me/offers?contractType=B2B&contractType=INTERNSHIP',
        { cookie: user.cookie },
      );
      const byContractOffers = (await byContract.json()) as Array<{
        title: string;
      }>;
      expect(byContractOffers.map((o) => o.title).sort()).toEqual(
        ['Data role', 'Frontend role'].sort(),
      );

      const all = await jsonRequest(meRoutes, '/me/offers', {
        cookie: user.cookie,
      });
      const allOffers = (await all.json()) as Array<{ title: string }>;
      expect(allOffers).toHaveLength(3);
      expect(allOffers[0]?.title).toBe('Data role');

      const oldest = await jsonRequest(meRoutes, '/me/offers?sort=oldest', {
        cookie: user.cookie,
      });
      const oldestOffers = (await oldest.json()) as Array<{ title: string }>;
      expect(oldestOffers[0]?.title).toBe('Frontend role');

      await deleteTestUser(user.id);
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
      const BeforeBody = (await before.json()) as { name: string };

      const res = await patchJson(
        meRoutes,
        '/me',
        { resumeLink: 'https://example.test/other-resume.pdf' },
        userB.cookie,
      );
      const body = (await res.json()) as { name: string };
      expect(body.name).toBe(BeforeBody.name);
    });
  });
});
