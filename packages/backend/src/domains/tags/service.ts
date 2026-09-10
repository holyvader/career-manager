import type { ServiceLogging } from '../../shared/logger';
import { failure } from '../../shared/serviceError';
import type { TagsRepository } from './repository';
import { DuplicateTagError } from './repository';
import type {
  ConnectTagBody,
  CreateTagBody,
  DisconnectTagBody,
} from './schemas';

export function createTagsService({
  repository,
  apiLogger,
  dbLogger,
}: ServiceLogging & { repository: TagsRepository }) {
  async function listTags(userId: string) {
    return repository.listTags(userId);
  }
  async function createTag(userId: string, body: CreateTagBody) {
    try {
      const tag = await repository.createTag(userId, body);
      apiLogger.info({ event: 'tag.created', tagId: tag.id }, 'Tag created');
      return tag;
    } catch (error) {
      if (error instanceof DuplicateTagError) {
        return failure(409, {
          message: 'You already have a tag with this name',
        });
      }
      dbLogger.error({ err: error, name: body.name }, 'Failed to create tag');
      return failure(400, 'Bad req');
    }
  }
  async function connectTag(userId: string, body: ConnectTagBody) {
    const tag = await repository.findOwner(body);
    if (!tag || tag.authorId !== userId) {
      return failure(403, { message: 'Forbidden' });
    }

    const ownedJobOffers = await repository.findOwnedOffers(userId, body);
    if (ownedJobOffers.length !== body.jobOffers.length) {
      return failure(403, { message: 'Forbidden' });
    }

    const result = await repository.connectOffers(body).catch((error) => {
      dbLogger.error(
        { err: error, tagId: body.tagId },
        'Failed to connect tag to job offers',
      );
      return failure(400, 'Bad req');
    });
    if (!result) {
      return failure(400, 'Bad req');
    }
    // Example event log: structured fields land as Loki labels/fields
    // alongside the message, queryable in Grafana Explore.
    apiLogger.info(
      {
        event: 'tag.connected',
        tagId: body.tagId,
        jobOfferIds: body.jobOffers,
      },
      'Tag connected to job offers',
    );
    return result;
  }
  async function getTag(userId: string, id: string) {
    const tag = await repository.getTag(userId, id);
    if (!tag) {
      return failure(404, { message: 'Tag not found' });
    }
    return tag;
  }
  async function deleteTag(userId: string, id: string) {
    const tag = await repository.findOwnedTag(userId, id);
    if (!tag) {
      return failure(404, { message: 'Tag not found' });
    }

    await repository.deleteTag(id);
    apiLogger.info({ event: 'tag.deleted', tagId: id }, 'Tag deleted');
    return { id };
  }
  async function disconnectTag(userId: string, body: DisconnectTagBody) {
    const tag = await repository.findOwner(body);
    if (!tag || tag.authorId !== userId) {
      return failure(403, { message: 'Forbidden' });
    }

    const ownedJobOffers = await repository.findOwnedOffers(userId, body);
    if (ownedJobOffers.length !== body.jobOffers.length) {
      return failure(403, { message: 'Forbidden' });
    }

    const result = await repository.disconnectOffers(body).catch((error) => {
      dbLogger.error(
        { err: error, tagId: body.tagId },
        'Failed to disconnect tag from job offers',
      );
      return failure(400, 'Bad req');
    });
    if (!result) {
      return failure(400, 'Bad req');
    }
    apiLogger.info(
      {
        event: 'tag.disconnected',
        tagId: body.tagId,
        jobOfferIds: body.jobOffers,
      },
      'Tag disconnected from job offers',
    );
    return result;
  }

  return { listTags, createTag, connectTag, getTag, deleteTag, disconnectTag };
}
