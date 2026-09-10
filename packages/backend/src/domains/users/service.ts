import type { ServiceLogging } from '../../shared/logger';
import { failure } from '../../shared/serviceError';
import type { UsersRepository } from './repository';
import type { UpdateProfileBody } from './schemas';

export function createUsersService({
  repository,
  apiLogger,
  dbLogger,
}: ServiceLogging & { repository: UsersRepository }) {
  async function getProfile(userId: string) {
    const result = await repository.findProfile(userId);
    if (!result) {
      return failure(404, { message: 'User not found' });
    }
    return result;
  }
  async function updateProfile(userId: string, body: UpdateProfileBody) {
    const current = await repository.findProfileName(userId);
    if (!current) {
      return failure(404, { message: 'User not found' });
    }

    const nextFirstName =
      body.firstName !== undefined ? body.firstName : current.first_name;
    const nextLastName =
      body.lastName !== undefined ? body.lastName : current.last_name;
    const nameChanged =
      body.firstName !== undefined || body.lastName !== undefined;

    const user = await repository
      .saveProfile(
        userId,
        body,
        nameChanged
          ? [nextFirstName, nextLastName].filter(Boolean).join(' ').trim()
          : undefined,
      )
      .catch((error) => {
        dbLogger.error(
          { err: error, userId: userId },
          'Failed to update profile',
        );
        return null;
      });
    if (!user) {
      return failure(400, 'Bad req');
    }
    apiLogger.info(
      { event: 'user.profile.updated', userId: user.id },
      'Profile updated',
    );
    return user;
  }

  return { getProfile, updateProfile };
}
