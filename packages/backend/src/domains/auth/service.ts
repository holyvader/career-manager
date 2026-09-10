import '../../env';
import { betterAuth } from 'better-auth';
import type { MailSender } from '../../email/mailSender';
import {
  passwordResetEmailTemplate,
  verificationEmailTemplate,
} from '../../email/templates';
import { mailLogger } from '../../tools/logger';
import { authDatabase } from './repository';

export function createAuthService(mailSender: MailSender) {
  return betterAuth({
    database: authDatabase,
    user: {
      additionalFields: {
        firstName: {
          type: 'string',
          required: false,
          fieldName: 'first_name',
        },
        lastName: {
          type: 'string',
          required: false,
          fieldName: 'last_name',
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      autoSignIn: false,
      sendResetPassword: async ({ user, url }) => {
        const { subject, text, html } = passwordResetEmailTemplate(url);
        await mailSender.send({ to: user.email, subject, text, html });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        const { subject, text, html } = verificationEmailTemplate(url);
        await mailSender.send({ to: user.email, subject, text, html });
      },
    },
    // Enabled unconditionally (better-auth otherwise only turns this on when
    // NODE_ENV=production, which nothing in this repo sets). Only actually
    // protects better-auth's own mounted HTTP routes (.mount(auth.handler) in
    // edenApp.ts) - it does NOT apply to direct auth.api.*() calls, which is
    // what our typed controller.ts wrapper routes use (verified directly: this
    // config has zero effect on /auth/signIn etc). Those routes have their
    // own rate limiter instead - see shared/rateLimit.ts.
    rateLimit: {
      enabled: true,
      window: 60,
      max: 100,
    },
    advanced: {
      // better-auth awaits sendVerificationEmail/sendResetPassword before
      // responding to the triggering request unless a background handler is
      // registered here - without this, sign-up/reset requests would hang on
      // the SMTP round-trip.
      backgroundTasks: {
        handler: (promise) => {
          promise.catch((error) => {
            mailLogger.error({ err: error }, 'Background email task failed');
          });
        },
      },
    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    trustedOrigins: [process.env.FRONTEND_URL ?? 'http://localhost:3333'],
  });
}
