import type { JobOffer, Tag } from '../../../generated/prisma/client';
import type {
  CreateOfferBody,
  ListOffersQuery,
  UpdateOfferBody,
} from './schemas';
export type OfferWithTags = JobOffer & { tags: Tag[] };
export interface JobOffersRepository {
  listOffers(userId: string, query: ListOffersQuery): Promise<OfferWithTags[]>;
  createOffer(userId: string, body: CreateOfferBody): Promise<JobOffer>;
  getOffer(userId: string, id: string): Promise<OfferWithTags | null>;
  findOwner(id: string): Promise<Pick<JobOffer, 'participantId'> | null>;
  saveOffer(id: string, body: UpdateOfferBody): Promise<OfferWithTags>;
}
