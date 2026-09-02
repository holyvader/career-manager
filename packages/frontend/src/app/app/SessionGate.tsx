import type { ReactNode } from 'react';
import { verifySession } from '@/lib/dal';

interface SessionGateProps {
  children: ReactNode;
}

// Verifying the session reads cookies, a per-request check, so it can't be
// statically prerendered. Wrap this in <Suspense> in each page so that
// dynamic check is the only part excluded from the static shell, rather than
// opting the whole route out of prerendering. `children` is only rendered
// once verifySession() resolves without redirecting, so nothing gated by it
// ever ships before the check passes.
export async function SessionGate({ children }: SessionGateProps) {
  await verifySession();
  return children;
}
