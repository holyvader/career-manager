import { prisma } from '../../db/prismaClient';
import { auth } from '../auth';

export interface TestUser {
  id: string;
  email: string;
  cookie: string;
}

// Creates a real user + session via better-auth itself (not inserted
// directly into the DB), so these tests exercise the same password-hashing
// / session-creation path production traffic does. Skips the real
// email-verification click-through for test speed - these tests are about
// authorization, not the verification flow itself.
export async function createTestUser(emailPrefix: string): Promise<TestUser> {
  const email = `${emailPrefix}-${crypto.randomUUID()}@example.test`;
  const password = 'password123!';

  const signUp = await auth.api.signUpEmail({
    body: { email, password, name: 'Test User' },
  });

  await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });

  const signInResponse = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });
  const setCookie = signInResponse.headers.get('set-cookie') ?? '';
  const cookie = setCookie.split(';')[0];
  if (!cookie) {
    throw new Error(
      'Test setup failed: sign-in did not return a session cookie',
    );
  }

  return { id: signUp.user.id, email, cookie };
}

// Cascades to the user's sessions/accounts/tags/job offers too (all set to
// onDelete: Cascade in schema.prisma).
export async function deleteTestUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
}

interface RequestOptions extends RequestInit {
  cookie?: string;
}

export function jsonRequest(
  app: { handle: (request: Request) => Promise<Response> },
  path: string,
  { cookie, headers, ...init }: RequestOptions = {},
) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      ...init,
      headers: {
        ...(headers as Record<string, string> | undefined),
        ...(cookie ? { cookie } : {}),
      },
    }),
  );
}

export function postJson(
  app: { handle: (request: Request) => Promise<Response> },
  path: string,
  body: unknown,
  cookie?: string,
) {
  return jsonRequest(app, path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cookie,
  });
}

export function patchJson(
  app: { handle: (request: Request) => Promise<Response> },
  path: string,
  body: unknown,
  cookie?: string,
) {
  return jsonRequest(app, path, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cookie,
  });
}
