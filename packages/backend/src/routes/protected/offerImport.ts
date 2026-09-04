import { Elysia, t } from 'elysia';
import { fetchJobOfferContent } from '../../jobOfferImport/fetchJobOfferContent';
import { apiLogger } from '../../tools/logger';
import { isRateLimited } from '../rateLimit';
import { authGuard } from './authGuard';

function safeHost(input: string): string | null {
  try {
    return new URL(input).hostname;
  } catch {
    return null;
  }
}

export const offerImportRoutes = new Elysia()
  .use(authGuard)
  .post(
    '/offers/import',
    async ({ body, request, session, status }) => {
      if (isRateLimited(request, 'offerImport', { windowMs: 60_000, max: 10 })) {
        return status(429, { message: 'Too many requests, please try again later' });
      }

      const result = await fetchJobOfferContent(body.url).catch((error) => {
        apiLogger.error(
          { err: error, host: safeHost(body.url) },
          'Failed to import job offer',
        );
        return null;
      });

      if (!result) {
        return status(400, {
          message: "Could not fetch that URL - check it's a supported job board link",
        });
      }

      apiLogger.info(
        {
          event: 'job-offer.imported',
          userId: session.user.id,
          titleFound: Boolean(result.title),
          contentLength: result.content?.length ?? 0,
        },
        'Job offer content imported',
      );
      return result;
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
