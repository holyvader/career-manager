import { serviceLogging } from '../../adapters/logging';
import { prismaTagsRepository } from './adapters/prismaRepository';
import { createTagsService } from './service';
export const tagsService = createTagsService({
  repository: prismaTagsRepository,
  ...serviceLogging,
});
