import { Prisma } from '../../../../generated/prisma/client';
import { prisma } from '../../../db/prismaClient';
import type { TagsRepository } from '../repository';
import { DuplicateTagError } from '../repository';
import type {
  ConnectTagBody,
  CreateTagBody,
  DisconnectTagBody,
} from '../schemas';

function listTags(userId: string) {
  return prisma.tag.findMany({
    where: { authorId: userId },
  });
}
async function createTag(userId: string, body: CreateTagBody) {
  try {
    return await prisma.tag.create({
      data: {
        name: body.name,
        authorId: userId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new DuplicateTagError();
    throw error;
  }
}
function findOwner(body: ConnectTagBody) {
  return prisma.tag.findUnique({
    where: { id: body.tagId },
    select: { authorId: true },
  });
}
function findOwnedOffers(userId: string, body: ConnectTagBody) {
  return prisma.jobOffer.findMany({
    where: {
      id: { in: body.jobOffers },
      participantId: userId,
    },
    select: { id: true },
  });
}
function connectOffers(body: ConnectTagBody) {
  return prisma.tag.update({
    data: {
      jobOffers: {
        connect: body.jobOffers.map((id) => ({ id })),
      },
    },
    where: {
      id: body.tagId,
    },
    select: {
      name: true,
      id: true,
    },
  });
}
function getTag(userId: string, id: string) {
  return prisma.tag.findUnique({
    where: {
      id,
      authorId: userId,
    },
    include: {
      jobOffers: {
        where: {
          participantId: userId,
        },
        select: {
          title: true,
        },
      },
    },
  });
}
function findOwnedTag(userId: string, id: string) {
  return prisma.tag.findUnique({
    where: { id, authorId: userId },
    select: { id: true },
  });
}
function deleteTag(id: string) {
  return prisma.tag.delete({ where: { id } });
}

function disconnectOffers(body: DisconnectTagBody) {
  return prisma.tag.update({
    data: {
      jobOffers: {
        disconnect: body.jobOffers.map((id) => ({ id })),
      },
    },
    where: {
      id: body.tagId,
    },
    select: {
      name: true,
      id: true,
    },
  });
}

export const prismaTagsRepository = {
  listTags,
  createTag,
  findOwner,
  findOwnedOffers,
  connectOffers,
  getTag,
  findOwnedTag,
  deleteTag,
  disconnectOffers,
} satisfies TagsRepository;
