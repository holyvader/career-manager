import { Elysia } from 'elysia';
import { auth } from '../auth';

// Shared by every protected route group (see me.ts, tag.ts) - each `.use()`s
// this so it's self-evident from the file alone that its routes require a
// session, rather than relying on a guard registered somewhere else up the
// chain. `as: 'scoped'` propagates the resolve to whichever instance uses
// this plugin (one level up), so `session` is typed and enforced there too.
export const authGuard = new Elysia({ name: 'auth-guard' }).resolve(
  { as: 'scoped' },
  async ({ request, status }) => {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return status(401, { message: 'Unauthorized' });
    }
    return { session };
  },
);
