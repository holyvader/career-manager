import { type Static, t } from 'elysia';
export const createTagBodySchema = t.Object({
  name: t.String({ minLength: 1, maxLength: 100 }),
});
export type CreateTagBody = Static<typeof createTagBodySchema>;
export const connectTagBodySchema = t.Object({
  tagId: t.String(),
  jobOffers: t.Array(t.String()),
});
export type ConnectTagBody = Static<typeof connectTagBodySchema>;
export const disconnectTagBodySchema = t.Object({
  tagId: t.String(),
  jobOffers: t.Array(t.String()),
});
export type DisconnectTagBody = Static<typeof disconnectTagBodySchema>;
