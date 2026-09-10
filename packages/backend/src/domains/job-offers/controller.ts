import { Elysia } from 'elysia';
import { ServiceError } from '../../shared/serviceError';
import { authGuard } from '../auth/guard';
import { jobOffersService as service } from './application';
import {
  createOfferBodySchema,
  listOffersQuerySchema,
  updateOfferBodySchema,
} from './schemas';
export const jobOffersController = new Elysia({ prefix: '/me' })
  .use(authGuard)
  .get(
    '/offers',
    ({ session, query }) => service.listOffers(session.user.id, query),
    {
      query: listOffersQuerySchema,
    },
  )
  .post(
    '/offers',
    async ({ session, status, body }) => {
      const result = await service.createOffer(session.user.id, body);
      return result instanceof ServiceError
        ? status(result.code, result.body)
        : result;
    },
    {
      body: createOfferBodySchema,
    },
  )
  .get('/offers/:id', async ({ session, status, params: { id } }) => {
    const result = await service.getOffer(session.user.id, id);
    return result instanceof ServiceError
      ? status(result.code, result.body)
      : result;
  })
  .patch(
    '/offers/:id',
    async ({ session, status, params: { id }, body }) => {
      const result = await service.updateOffer(session.user.id, id, body);
      return result instanceof ServiceError
        ? status(result.code, result.body)
        : result;
    },
    {
      body: updateOfferBodySchema,
    },
  );
