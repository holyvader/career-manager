import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getSession } from '@/lib/get-session';

// Data Access Layer: the one place that decides whether a request is
// authenticated. Call this from pages/data-fetching functions themselves
// (not layouts - layouts don't re-run on client-side navigation, so a check
// placed there won't be re-evaluated on every route change). Memoized with
// `cache()` so multiple calls within the same render pass only hit the
// session endpoint once.
export const verifySession = cache(async () => {
  const session = await getSession();

  if (!session) {
    redirect('/enter');
  }

  return session;
});
