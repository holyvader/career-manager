import { type Static, t } from 'elysia';
export const jobOfferStatusSchema = t.Union([
  t.Literal('STARTED'),
  t.Literal('IN_PROGRESS'),
  t.Literal('HIRED'),
  t.Literal('REJECTED'),
  t.Literal('CANCELED'),
]);

export const contractTypeSchema = t.Union([
  t.Literal('EMPLOYMENT_CONTRACT'),
  t.Literal('B2B'),
  t.Literal('MANDATE_CONTRACT'),
  t.Literal('CONTRACT_FOR_SPECIFIC_WORK'),
  t.Literal('INTERNSHIP'),
]);

export const remoteTypeSchema = t.Union([
  t.Literal('REMOTE'),
  t.Literal('HYBRID'),
  t.Literal('ONSITE'),
]);

export const senioritySchema = t.Union([
  t.Literal('JUNIOR'),
  t.Literal('MID'),
  t.Literal('SENIOR'),
  t.Literal('LEAD'),
]);

export const offerDetailFieldsSchema = {
  companyName: t.Optional(t.String({ maxLength: 200 })),
  location: t.Optional(t.String({ maxLength: 200 })),
  remoteType: t.Optional(remoteTypeSchema),
  seniority: t.Optional(senioritySchema),
  rate: t.Optional(t.String({ maxLength: 100 })),
  availability: t.Optional(t.String({ maxLength: 100 })),
  trackingLink: t.Optional(t.String({ format: 'uri', maxLength: 2048 })),
  notes: t.Optional(t.String({ maxLength: 10_000 })),
  contractType: t.Optional(t.Array(contractTypeSchema)),
};

export const listOffersQuerySchema = t.Object({
  q: t.Optional(t.String({ maxLength: 200 })),
  tagIds: t.Optional(t.Array(t.String())),
  contractType: t.Optional(t.Array(contractTypeSchema)),
  seniority: t.Optional(t.Array(senioritySchema)),
  remoteType: t.Optional(t.Array(remoteTypeSchema)),
  sort: t.Optional(t.Union([t.Literal('newest'), t.Literal('oldest')])),
});
export type ListOffersQuery = Static<typeof listOffersQuerySchema>;
export const createOfferBodySchema = t.Object({
  title: t.String({ minLength: 1, maxLength: 200 }),
  url: t.Optional(t.String({ format: 'uri', maxLength: 2048 })),
  content: t.Optional(t.String({ maxLength: 10_000 })),
  ...offerDetailFieldsSchema,
});
export type CreateOfferBody = Static<typeof createOfferBodySchema>;
export const updateOfferBodySchema = t.Object({
  title: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  url: t.Optional(t.String({ format: 'uri', maxLength: 2048 })),
  content: t.Optional(t.String({ maxLength: 10_000 })),
  status: t.Optional(jobOfferStatusSchema),
  ...offerDetailFieldsSchema,
});
export type UpdateOfferBody = Static<typeof updateOfferBodySchema>;
