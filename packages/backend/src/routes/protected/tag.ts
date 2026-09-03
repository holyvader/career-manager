import { Elysia, t } from 'elysia';
import { Prisma } from '../../../generated/prisma/client';
import { prisma } from '../../db/prismaClient';
import { apiLogger, dbLogger } from '../../tools/logger';
import { authGuard } from './authGuard';

export const tagRoutes = new Elysia()
  .use(authGuard)
  .get('/tags', async ({ session }) => {
    return prisma.tag.findMany({
      where: { authorId: session.user.id },
    });
  })
  .post(
    '/tags',
    async ({ body, session, status }) => {
      try {
        const tag = await prisma.tag.create({
          data: {
            name: body.name,
            authorId: session.user.id,
          },
        });
        apiLogger.info({ event: 'tag.created', tagId: tag.id }, 'Tag created');
        return tag;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return status(409, {
            message: 'You already have a tag with this name',
          });
        }
        dbLogger.error({ err: error, name: body.name }, 'Failed to create tag');
        return status(400, 'Bad req');
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1, maxLength: 100 }),
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
      return status(404, { message: 'Tag not found' });
    }
    return tag;
  })
  .delete('/tag/:id', async ({ params: { id }, session, status }) => {
    const tag = await prisma.tag.findUnique({
      where: { id, authorId: session.user.id },
      select: { id: true },
    });
    if (!tag) {
      return status(404, { message: 'Tag not found' });
    }

    await prisma.tag.delete({ where: { id } });
    apiLogger.info({ event: 'tag.deleted', tagId: id }, 'Tag deleted');
    return { id };
  })
  .post(
    '/tag/disconnect',
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
              disconnect: body.jobOffers.map((id) => ({ id })),
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
            'Failed to disconnect tag from job offers',
          );
          return status(400, 'Bad req');
        });
      if (!result) {
        return status(400, 'Bad req');
      }
      apiLogger.info(
        {
          event: 'tag.disconnected',
          tagId: body.tagId,
          jobOfferIds: body.jobOffers,
        },
        'Tag disconnected from job offers',
      );
      return result;
    },
    {
      body: t.Object({
        tagId: t.String(),
        jobOffers: t.Array(t.String()),
      }),
    },
  );
