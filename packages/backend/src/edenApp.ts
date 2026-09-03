import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import { auth } from './routes/auth';
import { authRpc } from './routes/authRpc';
import { protectedRoutes } from './routes/protected';
import { apiLogger } from './tools/logger';

// This is what the frontend's Eden Treaty client imports `App` from, so
// every route meant to be callable from the frontend must be `.use()`d here
// (not just mounted on `app` in app.ts) - `.mount()`ed routes like
// auth.handler below don't participate in Elysia's route-type tree either
// way and stay invisible to Eden regardless.
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
  .use(authRpc)
  .use(protectedRoutes);

export type App = typeof edenApp;
