import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import { auth } from './routes/auth';
import { authRpc } from './routes/authRpc';
import { apiLogger } from './tools/logger';

// Kept separate from app.ts: app.ts has pre-existing routes referencing a
// Prisma model that no longer exists on the schema, so importing its type
// from the frontend would drag those errors into the frontend's build. This
// file's dependency graph has no such issues, so it's what the frontend's
// Eden Treaty client imports `App` from.
export const edenApp = new Elysia()
  .use(
    cors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3333',
      credentials: true,
    }),
  )
  // Only expose docs outside production - it's a free map of the whole API
  // surface for anyone who finds it.
  .use(openapi({ enabled: process.env.NODE_ENV !== 'production' }))
  // Catches anything that isn't already handled by a route's own try/catch
  // (e.g. an unexpected Prisma error, a failure inside authGuard) so it
  // never falls through to Elysia's default handling and leaks internals.
  // Validation/not-found errors are left alone - Elysia's default responses
  // for those are already safe, structured, and useful to API consumers.
  .onError(({ code, error, request, set }) => {
    if (code === 'VALIDATION' || code === 'NOT_FOUND') {
      return;
    }
    apiLogger.error(
      { err: error, code, path: new URL(request.url).pathname },
      'Unhandled request error',
    );
    set.status = 500;
    return { message: 'Internal server error' };
  })
  .mount(auth.handler)
  .use(authRpc);

export type App = typeof edenApp;
