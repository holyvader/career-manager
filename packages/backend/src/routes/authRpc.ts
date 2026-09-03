import { Elysia, t } from 'elysia';
import { auth } from './auth';
import { isRateLimited } from './rateLimit';

const userSchema = t.Object({
  id: t.String(),
  email: t.String(),
  emailVerified: t.Boolean(),
  name: t.String(),
  firstName: t.Optional(t.Union([t.String(), t.Null()])),
  lastName: t.Optional(t.Union([t.String(), t.Null()])),
  image: t.Optional(t.Union([t.String(), t.Null()])),
  createdAt: t.String(),
  updatedAt: t.String(),
});

const sessionSchema = t.Object({
  id: t.String(),
  token: t.String(),
  userId: t.String(),
  expiresAt: t.String(),
  createdAt: t.String(),
  updatedAt: t.String(),
  ipAddress: t.Optional(t.Union([t.String(), t.Null()])),
  userAgent: t.Optional(t.Union([t.String(), t.Null()])),
});

// better-auth's APIError body shape, surfaced whenever an auth.api.* call
// (asResponse: true) fails - see error handling notes below.
const authErrorSchema = t.Object({
  message: t.Optional(t.String()),
  code: t.Optional(t.String()),
});

const rateLimitedSchema = t.Object({ message: t.String() });
const rateLimitedBody = () => ({
  message: 'Too many requests, please try again later',
});

// Thin typed wrappers around better-auth's server-side auth.api.* calls, so
// these actions participate in Elysia's route-type tree (and therefore Eden
// Treaty) - unlike auth.handler mounted below in edenApp.ts, which better-auth
// owns entirely and Elysia can't type. Each handler calls its auth.api.*
// counterpart with `asResponse: true`, which never throws (even on failure it
// resolves to a fully-formed Response with the right status/body/Set-Cookie)
// and Elysia passes a returned Response straight through untouched.
export const authRpc = new Elysia({ prefix: '/auth' })
  .post(
    '/signUp',
    ({ body, request, status }) => {
      if (isRateLimited(request, 'signUp', { windowMs: 10_000, max: 3 })) {
        return status(429, rateLimitedBody());
      }
      const { firstName, lastName, ...rest } = body;
      return auth.api.signUpEmail({
        body: {
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          ...rest,
        },
        headers: request.headers,
        asResponse: true,
      });
    },
    {
      body: t.Object({
        firstName: t.String({ minLength: 1, maxLength: 100 }),
        lastName: t.String({ minLength: 1, maxLength: 100 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        image: t.Optional(t.String()),
        callbackURL: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({
          token: t.Union([t.String(), t.Null()]),
          user: userSchema,
        }),
        400: authErrorSchema,
        422: authErrorSchema,
        429: rateLimitedSchema,
      },
    },
  )
  .post(
    '/signIn',
    ({ body, request, status }) => {
      if (isRateLimited(request, 'signIn', { windowMs: 10_000, max: 3 })) {
        return status(429, rateLimitedBody());
      }
      return auth.api.signInEmail({
        body,
        headers: request.headers,
        asResponse: true,
      });
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
        callbackURL: t.Optional(t.String()),
        rememberMe: t.Optional(t.Boolean()),
      }),
      response: {
        200: t.Object({
          redirect: t.Boolean(),
          token: t.String(),
          url: t.Optional(t.String()),
          user: userSchema,
        }),
        400: authErrorSchema,
        401: authErrorSchema,
        429: rateLimitedSchema,
      },
    },
  )
  .get(
    '/session',
    ({ request }) =>
      auth.api.getSession({ headers: request.headers, asResponse: true }),
    {
      response: {
        200: t.Union([
          t.Object({ session: sessionSchema, user: userSchema }),
          t.Null(),
        ]),
      },
    },
  )
  .post(
    '/forgotPassword',
    ({ body, request, status }) => {
      if (
        isRateLimited(request, 'forgotPassword', { windowMs: 60_000, max: 3 })
      ) {
        return status(429, rateLimitedBody());
      }
      return auth.api.requestPasswordReset({
        body,
        headers: request.headers,
        asResponse: true,
      });
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        redirectTo: t.Optional(t.String()),
      }),
      response: {
        200: t.Object({ status: t.Literal(true), message: t.String() }),
        400: authErrorSchema,
        429: rateLimitedSchema,
      },
    },
  )
  .post(
    '/resetPassword',
    ({ body, request, status }) => {
      if (
        isRateLimited(request, 'resetPassword', { windowMs: 60_000, max: 3 })
      ) {
        return status(429, rateLimitedBody());
      }
      return auth.api.resetPassword({
        body,
        headers: request.headers,
        asResponse: true,
      });
    },
    {
      body: t.Object({
        newPassword: t.String({ minLength: 8 }),
        token: t.String(),
      }),
      response: {
        200: t.Object({ status: t.Literal(true) }),
        400: authErrorSchema,
        401: authErrorSchema,
        429: rateLimitedSchema,
      },
    },
  )
  .post(
    '/signOut',
    ({ request }) =>
      auth.api.signOut({ headers: request.headers, asResponse: true }),
    {
      response: {
        200: t.Object({
          success: t.Boolean(),
          url: t.Optional(t.String()),
          redirect: t.Optional(t.Boolean()),
        }),
        400: authErrorSchema,
      },
    },
  );
