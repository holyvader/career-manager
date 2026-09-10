import { Elysia } from 'elysia';
import { ServiceError } from '../../shared/serviceError';
import { authGuard } from '../auth/guard';
import { usersService as service } from './application';
import { updateProfileBodySchema } from './schemas';
export const usersController = new Elysia({ prefix: '/me' })
  .use(authGuard)
  .get('/', async ({ session, status }) => {
    const result = await service.getProfile(session.user.id);
    return result instanceof ServiceError
      ? status(result.code, result.body)
      : result;
  })
  .patch(
    '/',
    async ({ session, status, body }) => {
      const result = await service.updateProfile(session.user.id, body);
      return result instanceof ServiceError
        ? status(result.code, result.body)
        : result;
    },
    {
      body: updateProfileBodySchema,
    },
  );
