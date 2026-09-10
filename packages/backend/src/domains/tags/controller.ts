import { Elysia } from 'elysia';
import { ServiceError } from '../../shared/serviceError';
import { authGuard } from '../auth/guard';
import { tagsService as service } from './application';
import {
  connectTagBodySchema,
  createTagBodySchema,
  disconnectTagBodySchema,
} from './schemas';
export const tagsController = new Elysia()
  .use(authGuard)
  .get('/tags', ({ session }) => service.listTags(session.user.id))
  .post(
    '/tags',
    async ({ session, status, body }) => {
      const result = await service.createTag(session.user.id, body);
      return result instanceof ServiceError
        ? status(result.code, result.body)
        : result;
    },
    {
      body: createTagBodySchema,
    },
  )
  .post(
    '/tag/connect',
    async ({ session, status, body }) => {
      const result = await service.connectTag(session.user.id, body);
      return result instanceof ServiceError
        ? status(result.code, result.body)
        : result;
    },
    {
      body: connectTagBodySchema,
    },
  )
  .get('/tag/:id', async ({ session, status, params: { id } }) => {
    const result = await service.getTag(session.user.id, id);
    return result instanceof ServiceError
      ? status(result.code, result.body)
      : result;
  })
  .delete('/tag/:id', async ({ session, status, params: { id } }) => {
    const result = await service.deleteTag(session.user.id, id);
    return result instanceof ServiceError
      ? status(result.code, result.body)
      : result;
  })
  .post(
    '/tag/disconnect',
    async ({ session, status, body }) => {
      const result = await service.disconnectTag(session.user.id, body);
      return result instanceof ServiceError
        ? status(result.code, result.body)
        : result;
    },
    {
      body: disconnectTagBodySchema,
    },
  );
