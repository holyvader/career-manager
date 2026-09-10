import { prisma } from '../../../db/prismaClient';
import type { JobOffersRepository } from '../repository';
import type {
  CreateOfferBody,
  ListOffersQuery,
  UpdateOfferBody,
} from '../schemas';

function listOffers(userId: string, query: ListOffersQuery) {
  const { q, tagIds, contractType, seniority, remoteType, sort } = query;
  return prisma.jobOffer.findMany({
    where: {
      participantId: userId,
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
          { companyName: { contains: q, mode: 'insensitive' } },
          { location: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(tagIds?.length && { tags: { some: { id: { in: tagIds } } } }),
      ...(contractType?.length && {
        contractType: { hasSome: contractType },
      }),
      ...(seniority?.length && { seniority: { in: seniority } }),
      ...(remoteType?.length && { remoteType: { in: remoteType } }),
    },
    orderBy: { createdAt: sort === 'oldest' ? 'asc' : 'desc' },
    include: {
      tags: true,
    },
  });
}
function createOffer(userId: string, body: CreateOfferBody) {
  return prisma.jobOffer.create({
    data: {
      title: body.title,
      url: body.url,
      content: body.content,
      companyName: body.companyName,
      location: body.location,
      remoteType: body.remoteType,
      seniority: body.seniority,
      rate: body.rate,
      availability: body.availability,
      trackingLink: body.trackingLink,
      notes: body.notes,
      contractType: body.contractType,
      participantId: userId,
    },
  });
}
function getOffer(userId: string, id: string) {
  return prisma.jobOffer.findUnique({
    where: {
      id,
      participantId: userId,
    },
    include: {
      tags: true,
    },
  });
}
function findOwner(id: string) {
  return prisma.jobOffer.findUnique({
    where: { id },
    select: { participantId: true },
  });
}
function saveOffer(id: string, body: UpdateOfferBody) {
  return prisma.jobOffer.update({
    where: { id },
    data: {
      title: body.title,
      url: body.url,
      content: body.content,
      status: body.status,
      companyName: body.companyName,
      location: body.location,
      remoteType: body.remoteType,
      seniority: body.seniority,
      rate: body.rate,
      availability: body.availability,
      trackingLink: body.trackingLink,
      notes: body.notes,
      contractType: body.contractType,
    },
    include: { tags: true },
  });
}

export const prismaJobOffersRepository = {
  listOffers,
  createOffer,
  getOffer,
  findOwner,
  saveOffer,
} satisfies JobOffersRepository;
