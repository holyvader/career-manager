import { serviceLogging } from '../../adapters/logging';
import { jobBoardContentSource } from './adapters/jobBoardContentSource';
import { prismaJobOffersRepository } from './adapters/prismaRepository';
import { createJobOffersService } from './service';
export const jobOffersService = createJobOffersService({
  repository: prismaJobOffersRepository,
  ...serviceLogging,
  contentSource: jobBoardContentSource,
});
