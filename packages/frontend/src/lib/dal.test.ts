import { afterEach, describe, expect, it, mock } from 'bun:test';

// One redirect scenario per file - dal.ts's verifySession is wrapped in
// React's cache(), which memoizes across calls within the same module
// instance, so a second scenario in this file would just replay the first
// call's cached result instead of exercising the new mocks.
describe('verifySession (no session)', () => {
  afterEach(() => {
    mock.restore();
  });

  it('redirects to /enter when there is no session', async () => {
    mock.module('next/navigation', () => ({
      redirect: (url: string) => {
        throw new Error(`REDIRECT:${url}`);
      },
    }));
    mock.module('@/lib/get-session', () => ({
      getSession: async () => null,
    }));

    const { verifySession } = await import('./dal');
    await expect(verifySession()).rejects.toThrow('REDIRECT:/enter');
  });
});
