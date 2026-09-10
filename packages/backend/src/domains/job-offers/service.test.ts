import { describe, expect, it, mock } from 'bun:test';
import type { ServiceLogging } from '../../shared/logger';
import { ServiceError } from '../../shared/serviceError';
import type { JobOfferContentSource } from './contentSource';
import type { JobOffersRepository } from './repository';
import { createJobOffersService } from './service';

const logging: ServiceLogging = {
  apiLogger: { info() {}, error() {} },
  dbLogger: { info() {}, error() {} },
};
const unexpected = async (): Promise<never> => {
  throw new Error('Unexpected repository call');
};
function service(
  contentSource: JobOfferContentSource,
  overrides: Partial<JobOffersRepository> = {},
) {
  return createJobOffersService({
    repository: {
      listOffers: unexpected,
      createOffer: unexpected,
      getOffer: unexpected,
      findOwner: unexpected,
      saveOffer: unexpected,
      ...overrides,
    },
    contentSource,
    ...logging,
  });
}

describe('job-offer service with adapters', () => {
  it('returns content supplied by an injected source', async () => {
    const content = { title: 'Engineer', content: 'Description' };
    const fetchContent = mock(async () => content);
    expect(
      await service({ fetchContent }).importOffer(
        'user-1',
        'https://pracuj.pl/job',
      ),
    ).toEqual(content);
    expect(fetchContent).toHaveBeenCalledWith('https://pracuj.pl/job');
  });

  it('maps source failures to the existing application error', async () => {
    const result = await service({
      fetchContent: async () => {
        throw new Error('Timeout');
      },
    }).importOffer('user-1', 'https://pracuj.pl/job');
    expect(result).toEqual(
      new ServiceError(400, {
        message:
          "Could not fetch that URL - check it's a supported job board link",
      }),
    );
  });

  it('rejects unsafe offer links before persistence', async () => {
    expect(
      await service({ fetchContent: unexpected }).createOffer('user-1', {
        title: 'Engineer',
        url: 'javascript:alert(1)',
      }),
    ).toEqual(new ServiceError(400, { message: 'url must be an http(s) URL' }));
  });

  it('prevents another user from updating an offer before calling the write adapter', async () => {
    expect(
      await service(
        { fetchContent: unexpected },
        { findOwner: async () => ({ participantId: 'owner' }) },
      ).updateOffer('stranger', 'offer-1', { title: 'Changed' }),
    ).toEqual(new ServiceError(404, { message: 'Job offer not found' }));
  });
});
