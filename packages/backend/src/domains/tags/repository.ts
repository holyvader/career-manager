import type { Tag } from '../../../generated/prisma/client';
import type {
  ConnectTagBody,
  CreateTagBody,
  DisconnectTagBody,
} from './schemas';
export class DuplicateTagError extends Error {
  constructor() {
    super('You already have a tag with this name');
    this.name = 'DuplicateTagError';
  }
}
export interface TagsRepository {
  listTags(userId: string): Promise<Tag[]>;
  createTag(userId: string, body: CreateTagBody): Promise<Tag>;
  findOwner(body: ConnectTagBody): Promise<Pick<Tag, 'authorId'> | null>;
  findOwnedOffers(
    userId: string,
    body: ConnectTagBody,
  ): Promise<{ id: string }[]>;
  connectOffers(body: ConnectTagBody): Promise<Pick<Tag, 'id' | 'name'>>;
  getTag(
    userId: string,
    id: string,
  ): Promise<(Tag & { jobOffers: { title: string }[] }) | null>;
  findOwnedTag(userId: string, id: string): Promise<Pick<Tag, 'id'> | null>;
  deleteTag(id: string): Promise<Tag>;
  disconnectOffers(body: DisconnectTagBody): Promise<Pick<Tag, 'id' | 'name'>>;
}
