import { describe, expect, it, mock } from 'bun:test';
import type { ServiceLogging } from '../../shared/logger';
import { ServiceError } from '../../shared/serviceError';
import type { UsersRepository } from './repository';
import { createUsersService } from './service';

const logging: ServiceLogging = {
  apiLogger: { info() {}, error() {} },
  dbLogger: { info() {}, error() {} },
};
const unexpected = async (): Promise<never> => {
  throw new Error('Unexpected repository call');
};
function repository(overrides: Partial<UsersRepository>): UsersRepository {
  return {
    findProfile: unexpected,
    findProfileName: unexpected,
    saveProfile: unexpected,
    ...overrides,
  };
}

describe('users service with a repository adapter', () => {
  it('does not persist a profile when the user is missing', async () => {
    const service = createUsersService({
      repository: repository({ findProfileName: async () => null }),
      ...logging,
    });
    expect(
      await service.updateProfile('missing', { firstName: 'New' }),
    ).toEqual(new ServiceError(404, { message: 'User not found' }));
  });

  it('combines a partial name update with the stored last name', async () => {
    const saveProfile = mock(async (): Promise<never> => {
      throw new Error('Database unavailable');
    });
    const service = createUsersService({
      repository: repository({
        findProfileName: async () => ({
          first_name: 'Old',
          last_name: 'Family',
        }),
        saveProfile,
      }),
      ...logging,
    });
    const body = { firstName: 'New' };
    expect(await service.updateProfile('user-1', body)).toEqual(
      new ServiceError(400, 'Bad req'),
    );
    expect(saveProfile).toHaveBeenCalledWith('user-1', body, 'New Family');
  });
});
