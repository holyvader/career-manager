import type { User } from '../../../generated/prisma/client';
import type { OfferWithTags } from '../job-offers/repository';
import type { UpdateProfileBody } from './schemas';
export interface UsersRepository {
  findProfile(
    userId: string,
  ): Promise<(User & { jobOffers: OfferWithTags[] }) | null>;
  findProfileName(
    userId: string,
  ): Promise<Pick<User, 'first_name' | 'last_name'> | null>;
  saveProfile(
    userId: string,
    body: UpdateProfileBody,
    name: string | undefined,
  ): Promise<User>;
}
