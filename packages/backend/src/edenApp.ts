import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { Elysia } from 'elysia';
import { auth } from './routes/auth';
import { authRpc } from './routes/authRpc';

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
  .use(openapi())
  .mount(auth.handler)
  .use(authRpc);

export type App = typeof edenApp;
