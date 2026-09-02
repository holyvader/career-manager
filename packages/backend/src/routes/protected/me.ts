import { Elysia, t } from 'elysia';
import { prisma } from '../../db/prismaClient';
import { apiLogger, dbLogger } from '../../tools/logger';
import { authGuard } from './authGuard';

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
      return status(404, { message: 'User not found ' });
    }
    return result;
  })
  .get('/offers', async ({ session, status }) => {
    const offers = await prisma.jobOffer.findMany({
      where: {
        participantId: session.user.id,
      },
      include: {
        tags: true,
      },
    });
    if (!offers.length) {
      return status(404, { message: 'Job offers not found ' });
    }
    return offers;
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
        title: t.String(),
        url: t.Optional(t.String()),
        content: t.Optional(t.String()),
      }),
    },
  );
