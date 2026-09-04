import { Elysia, t } from 'elysia';
import { prisma } from '../../db/prismaClient';
import { apiLogger, dbLogger } from '../../tools/logger';
import { authGuard } from './authGuard';

const jobOfferStatusSchema = t.Union([
  t.Literal('STARTED'),
  t.Literal('IN_PROGRESS'),
  t.Literal('HIRED'),
  t.Literal('REJECTED'),
  t.Literal('CANCELED'),
]);

const contractTypeSchema = t.Union([
  t.Literal('EMPLOYMENT_CONTRACT'),
  t.Literal('B2B'),
  t.Literal('MANDATE_CONTRACT'),
  t.Literal('CONTRACT_FOR_SPECIFIC_WORK'),
  t.Literal('INTERNSHIP'),
]);

const remoteTypeSchema = t.Union([
  t.Literal('REMOTE'),
  t.Literal('HYBRID'),
  t.Literal('ONSITE'),
]);

const senioritySchema = t.Union([
  t.Literal('JUNIOR'),
  t.Literal('MID'),
  t.Literal('SENIOR'),
  t.Literal('LEAD'),
]);

const offerDetailFieldsSchema = {
  companyName: t.Optional(t.String({ maxLength: 200 })),
  location: t.Optional(t.String({ maxLength: 200 })),
  remoteType: t.Optional(remoteTypeSchema),
  seniority: t.Optional(senioritySchema),
  rate: t.Optional(t.String({ maxLength: 100 })),
  availability: t.Optional(t.String({ maxLength: 100 })),
  contractType: t.Optional(t.Array(contractTypeSchema)),
};

const linkSchema = t.Object({
  label: t.String({ minLength: 1, maxLength: 100 }),
  url: t.String({ format: 'uri', maxLength: 2048 }),
});

export const meRoutes = new Elysia({ prefix: '/me' })
  .use(authGuard)
  .get('/', async ({ status, session }) => {
    const result = await prisma.user.findFirst({
      where: {
        id: session.user.id,
      },
      include: {
        jobOffers: {
          include: {
            tags: true,
          },
        },
      },
    });
    if (!result) {
      return status(404, { message: 'User not found' });
    }
    return result;
  })
  .patch(
    '/',
    async ({ body, session, status }) => {
      const current = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { first_name: true, last_name: true },
      });
      if (!current) {
        return status(404, { message: 'User not found' });
      }

      const nextFirstName =
        body.firstName !== undefined ? body.firstName : current.first_name;
      const nextLastName =
        body.lastName !== undefined ? body.lastName : current.last_name;
      const nameChanged =
        body.firstName !== undefined || body.lastName !== undefined;

      const user = await prisma.user
        .update({
          where: { id: session.user.id },
          data: {
            first_name: body.firstName,
            last_name: body.lastName,
            resume_link: body.resumeLink,
            links: body.links,
            ...(nameChanged && {
              name: [nextFirstName, nextLastName]
                .filter(Boolean)
                .join(' ')
                .trim(),
            }),
          },
        })
        .catch((error) => {
          dbLogger.error(
            { err: error, userId: session.user.id },
            'Failed to update profile',
          );
          return null;
        });
      if (!user) {
        return status(400, 'Bad req');
      }
      apiLogger.info(
        { event: 'user.profile.updated', userId: user.id },
        'Profile updated',
      );
      return user;
    },
    {
      body: t.Object({
        firstName: t.Optional(t.String({ maxLength: 100 })),
        lastName: t.Optional(t.String({ maxLength: 100 })),
        resumeLink: t.Optional(t.String({ format: 'uri', maxLength: 2048 })),
        links: t.Optional(t.Array(linkSchema)),
      }),
    },
  )
  .get(
    '/offers',
    async ({
      session,
      query: { q, tagIds, contractType, seniority, remoteType, sort },
    }) => {
      return prisma.jobOffer.findMany({
        where: {
          participantId: session.user.id,
          ...(q && {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { content: { contains: q, mode: 'insensitive' } },
              { companyName: { contains: q, mode: 'insensitive' } },
              { location: { contains: q, mode: 'insensitive' } },
            ],
          }),
          ...(tagIds?.length && { tags: { some: { id: { in: tagIds } } } }),
          ...(contractType?.length && {
            contractType: { hasSome: contractType },
          }),
          ...(seniority?.length && { seniority: { in: seniority } }),
          ...(remoteType?.length && { remoteType: { in: remoteType } }),
        },
        orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
        include: {
          tags: true,
        },
      });
    },
    {
      query: t.Object({
        q: t.Optional(t.String({ maxLength: 200 })),
        tagIds: t.Optional(t.Array(t.String())),
        contractType: t.Optional(t.Array(contractTypeSchema)),
        seniority: t.Optional(t.Array(senioritySchema)),
        remoteType: t.Optional(t.Array(remoteTypeSchema)),
        sort: t.Optional(t.Union([t.Literal('newest'), t.Literal('oldest')])),
      }),
    },
  )
  .post(
    '/offers',
    async ({ body, session, status }) => {
      const offer = await prisma.jobOffer
        .create({
          data: {
            title: body.title,
            url: body.url,
            content: body.content,
            companyName: body.companyName,
            location: body.location,
            remoteType: body.remoteType,
            seniority: body.seniority,
            rate: body.rate,
            availability: body.availability,
            contractType: body.contractType,
            participantId: session.user.id,
          },
        })
        .catch((error) => {
          dbLogger.error(
            { err: error, title: body.title },
            'Failed to create job offer',
          );
          return null;
        });
      if (!offer) {
        return status(400, 'Bad req');
      }
      apiLogger.info(
        { event: 'job-offer.created', jobOfferId: offer.id },
        'Job offer created',
      );
      return offer;
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1, maxLength: 200 }),
        url: t.Optional(t.String({ format: 'uri', maxLength: 2048 })),
        content: t.Optional(t.String({ maxLength: 10_000 })),
        ...offerDetailFieldsSchema,
      }),
    },
  )
  .get('/offers/:id', async ({ params: { id }, session, status }) => {
    const offer = await prisma.jobOffer.findUnique({
      where: {
        id,
        participantId: session.user.id,
      },
      include: {
        tags: true,
      },
    });
    if (!offer) {
      return status(404, { message: 'Job offer not found' });
    }
    return offer;
  })
  .patch(
    '/offers/:id',
    async ({ params: { id }, body, session, status }) => {
      const current = await prisma.jobOffer.findUnique({
        where: { id },
        select: { participantId: true },
      });
      if (!current || current.participantId !== session.user.id) {
        return status(404, { message: 'Job offer not found' });
      }

      const offer = await prisma.jobOffer
        .update({
          where: { id },
          data: {
            title: body.title,
            url: body.url,
            content: body.content,
            status: body.status,
            companyName: body.companyName,
            location: body.location,
            remoteType: body.remoteType,
            seniority: body.seniority,
            rate: body.rate,
            availability: body.availability,
            contractType: body.contractType,
          },
          include: { tags: true },
        })
        .catch((error) => {
          dbLogger.error(
            { err: error, jobOfferId: id },
            'Failed to update job offer',
          );
          return null;
        });
      if (!offer) {
        return status(400, 'Bad req');
      }
      apiLogger.info(
        { event: 'job-offer.updated', jobOfferId: offer.id },
        'Job offer updated',
      );
      return offer;
    },
    {
      body: t.Object({
        title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
        url: t.Optional(t.String({ format: 'uri', maxLength: 2048 })),
        content: t.Optional(t.String({ maxLength: 10_000 })),
        status: t.Optional(jobOfferStatusSchema),
        ...offerDetailFieldsSchema,
      }),
    },
  );
