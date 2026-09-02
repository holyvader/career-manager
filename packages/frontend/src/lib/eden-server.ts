import { treaty } from '@elysiajs/eden';
import type { App } from 'backend/src/edenApp';
import { cookies } from 'next/headers';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3334';

// For Server Components - there's no browser here, so the incoming request's
// cookies must be forwarded explicitly to the backend.
export const edenServer = treaty<App>(BACKEND_URL, {
  headers: async () => ({ cookie: (await cookies()).toString() }),
});
