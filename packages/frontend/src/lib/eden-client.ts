import { treaty } from '@elysiajs/eden';
import type { App } from 'backend/src/edenApp';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3334';

// For Client Components - the browser sends its own cookies with the request.
export const edenClient = treaty<App>(BACKEND_URL, {
  fetch: { credentials: 'include' },
});
