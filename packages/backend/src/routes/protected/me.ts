import { Elysia, t } from 'elysia';
import { prisma } from '../../db/prismaClient';
import { apiLogger, dbLogger } from '../../tools/logger';
import { authGuard } from './authGuard';

const jobOfferStatusSchema = t.Union([
  t.Literal('STARTED'),
  t.Literal('IN_PROGRESS'),
  t.Literal('HIRED'),
  t.Literal('CANCELED'),
]);

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
  .get('/offers', async ({ session }) => {
    return prisma.jobOffer.findMany({
      where: {
        participantId: session.user.id,
      },
      include: {
        tags: true,
      },
    });
  })
  .post(
    '/offers',
    async ({ body, session, status }) => {
      const offer = await prisma.jobOffer
        .create({
          data: {
            title: body.title,
            url: body.url,
            content: body.content,
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
      }),
    },
  );
