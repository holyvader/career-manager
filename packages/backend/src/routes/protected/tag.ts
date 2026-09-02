import { Elysia, t } from 'elysia';
import { prisma } from '../../db/prismaClient';
import { apiLogger, dbLogger } from '../../tools/logger';
import { authGuard } from './authGuard';

export const tagRoutes = new Elysia()
  .use(authGuard)
  .get('/tags', async ({ session, status }) => {
    const tags = await prisma.tag.findMany({
      where: { authorId: session.user.id },
    });
    if (!tags?.length) {
      return status(404, { message: 'Tags not found ' });
    }
    return tags;
  })
  .post(
    '/tags',
    async ({ body, session, status }) => {
      const tag = await prisma.tag
        .create({
          data: {
            name: body.name,
            authorId: session.user.id,
          },
        })
        .catch((error) => {
          dbLogger.error(
            { err: error, name: body.name },
            'Failed to create tag',
          );
          return null;
        });
      if (!tag) {
        return status(400, 'Bad req');
      }
      apiLogger.info({ event: 'tag.created', tagId: tag.id }, 'Tag created');
      return tag;
    },
    {
      body: t.Object({
        name: t.String(),
      }),
    },
  )
  .post(
    '/tag/connect',
    async ({ body, session, status }) => {
      const tag = await prisma.tag.findUnique({
        where: { id: body.tagId },
        select: { authorId: true },
      });
      if (!tag || tag.authorId !== session.user.id) {
        return status(403, { message: 'Forbidden' });
      }

      const ownedJobOffers = await prisma.jobOffer.findMany({
        where: {
          id: { in: body.jobOffers },
          participantId: session.user.id,
        },
        select: { id: true },
      });
      if (ownedJobOffers.length !== body.jobOffers.length) {
        return status(403, { message: 'Forbidden' });
      }

      const result = await prisma.tag
        .update({
          data: {
            jobOffers: {
              connect: body.jobOffers.map((id) => ({ id })),
            },
          },
          where: {
            id: body.tagId,
          },
          select: {
            name: true,
            id: true,
          },
        })
        .catch((error) => {
          dbLogger.error(
            { err: error, tagId: body.tagId },
            'Failed to connect tag to job offers',
          );
          return status(400, 'Bad req');
        });
      if (!result) {
        return status(400, 'Bad req');
      }
      // Example event log: structured fields land as Loki labels/fields
      // alongside the message, queryable in Grafana Explore.
      apiLogger.info(
        {
          event: 'tag.connected',
          tagId: body.tagId,
          jobOfferIds: body.jobOffers,
        },
        'Tag connected to job offers',
      );
      return result;
    },
    {
      body: t.Object({
        tagId: t.String(),
        jobOffers: t.Array(t.String()),
      }),
    },
  )
  .get('/tag/:id', async ({ params: { id }, session, status }) => {
    const tag = await prisma.tag.findUnique({
      where: {
        id,
        authorId: session.user.id,
      },
      include: {
        jobOffers: {
          where: {
            participantId: session.user.id,
          },
          select: {
            title: true,
          },
        },
      },
    });
    if (!tag) {
      return status(404, { message: 'Tag not found ' });
    }
    return tag;
  });
