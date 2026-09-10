import { serviceLogging } from '../../adapters/logging';
import { prismaUsersRepository } from './adapters/prismaRepository';
import { createUsersService } from './service';
export const usersService = createUsersService({
  repository: prismaUsersRepository,
  ...serviceLogging,
});
