import { Elysia, t } from 'elysia';
import { isRateLimited } from '../../shared/rateLimit';
import { ServiceError } from '../../shared/serviceError';
import { authGuard } from '../auth/guard';
import { jobOffersService } from './application';

export const offerImportRoutes = new Elysia().use(authGuard).post(
  '/offers/import',
  async ({ body, request, session, status }) => {
    if (isRateLimited(request, 'offerImport', { windowMs: 60_000, max: 10 })) {
      return status(429, {
        message: 'Too many requests, please try again later',
      });
    }

    const result = await jobOffersService.importOffer(
      session.user.id,
      body.url,
    );
    return result instanceof ServiceError
      ? status(result.code, result.body)
      : result;
  },
  {
    body: t.Object({
      url: t.String({ format: 'uri', maxLength: 2048 }),
    }),
    response: {
      200: t.Object({
        title: t.Union([t.String(), t.Null()]),
        content: t.Union([t.String(), t.Null()]),
      }),
      400: t.Object({ message: t.String() }),
      429: t.Object({ message: t.String() }),
    },
  },
);
