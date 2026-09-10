import { type Static, t } from 'elysia';
export const linkSchema = t.Object({
  label: t.String({ minLength: 1, maxLength: 100 }),
  url: t.String({ format: 'uri', maxLength: 2048 }),
});

export const updateProfileBodySchema = t.Object({
  firstName: t.Optional(t.String({ maxLength: 100 })),
  lastName: t.Optional(t.String({ maxLength: 100 })),
  resumeLink: t.Optional(t.String({ format: 'uri', maxLength: 2048 })),
  links: t.Optional(t.Array(linkSchema)),
});
export type UpdateProfileBody = Static<typeof updateProfileBodySchema>;
