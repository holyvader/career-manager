import type { ServiceLogging } from '../../shared/logger';
import { failure } from '../../shared/serviceError';
import type { JobOfferContentSource } from './contentSource';
import type { JobOffersRepository } from './repository';
import type {
  CreateOfferBody,
  ListOffersQuery,
  UpdateOfferBody,
} from './schemas';

export function createJobOffersService({
  repository,
  apiLogger,
  dbLogger,
  contentSource,
}: ServiceLogging & {
  repository: JobOffersRepository;
  contentSource: JobOfferContentSource;
}) {
  // TypeBox's `format: 'uri'` only checks URI syntax - it happily accepts
  // `javascript:`/`data:` schemes, which would execute if ever rendered as a
  // clickable link (as `trackingLink` is, in OfferPreview.tsx). Reject
  // anything that isn't a plain http(s) link before it reaches the database.
  function isHttpUrl(value: string): boolean {
    try {
      const protocol = new URL(value).protocol;
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }

  async function listOffers(userId: string, query: ListOffersQuery) {
    return repository.listOffers(userId, query);
  }
  async function createOffer(userId: string, body: CreateOfferBody) {
    if (body.url && !isHttpUrl(body.url)) {
      return failure(400, { message: 'url must be an http(s) URL' });
    }
    if (body.trackingLink && !isHttpUrl(body.trackingLink)) {
      return failure(400, { message: 'trackingLink must be an http(s) URL' });
    }
    const offer = await repository.createOffer(userId, body).catch((error) => {
      dbLogger.error(
        { err: error, title: body.title },
        'Failed to create job offer',
      );
      return null;
    });
    if (!offer) {
      return failure(400, 'Bad req');
    }
    apiLogger.info(
      { event: 'job-offer.created', jobOfferId: offer.id },
      'Job offer created',
    );
    return offer;
  }
  async function getOffer(userId: string, id: string) {
    const offer = await repository.getOffer(userId, id);
    if (!offer) {
      return failure(404, { message: 'Job offer not found' });
    }
    return offer;
  }
  async function updateOffer(
    userId: string,
    id: string,
    body: UpdateOfferBody,
  ) {
    const current = await repository.findOwner(id);
    if (!current || current.participantId !== userId) {
      return failure(404, { message: 'Job offer not found' });
    }
    if (body.url && !isHttpUrl(body.url)) {
      return failure(400, { message: 'url must be an http(s) URL' });
    }
    if (body.trackingLink && !isHttpUrl(body.trackingLink)) {
      return failure(400, { message: 'trackingLink must be an http(s) URL' });
    }

    const offer = await repository.saveOffer(id, body).catch((error) => {
      dbLogger.error(
        { err: error, jobOfferId: id },
        'Failed to update job offer',
      );
      return null;
    });
    if (!offer) {
      return failure(400, 'Bad req');
    }
    apiLogger.info(
      { event: 'job-offer.updated', jobOfferId: offer.id },
      'Job offer updated',
    );
    return offer;
  }
  function safeHost(input: string): string | null {
    try {
      return new URL(input).hostname;
    } catch {
      return null;
    }
  }

  async function importOffer(userId: string, url: string) {
    const result = await contentSource.fetchContent(url).catch((error) => {
      apiLogger.error(
        { err: error, host: safeHost(url) },
        'Failed to import job offer',
      );
      return null;
    });

    if (!result) {
      return failure(400, {
        message:
          "Could not fetch that URL - check it's a supported job board link",
      });
    }

    apiLogger.info(
      {
        event: 'job-offer.imported',
        userId: userId,
        titleFound: Boolean(result.title),
        contentLength: result.content?.length ?? 0,
      },
      'Job offer content imported',
    );
    return result;
  }

  return { listOffers, createOffer, getOffer, updateOffer, importOffer };
}
