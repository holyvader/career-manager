import { prisma } from '../../../db/prismaClient';
import type { UsersRepository } from '../repository';
import type { UpdateProfileBody } from '../schemas';

function findProfile(userId: string) {
  return prisma.user.findFirst({
    where: {
      id: userId,
    },
    include: {
      jobOffers: {
        include: {
          tags: true,
        },
      },
    },
  });
}
function findProfileName(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { first_name: true, last_name: true },
  });
}
function saveProfile(
  userId: string,
  body: UpdateProfileBody,
  name: string | undefined,
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      first_name: body.firstName,
      last_name: body.lastName,
      resume_link: body.resumeLink,
      links: body.links,
      name,
    },
  });
}

export const prismaUsersRepository = {
  findProfile,
  findProfileName,
  saveProfile,
} satisfies UsersRepository;
