import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { config } from 'dotenv';
import { prisma } from '../db/prismaClient';
import { sendMail } from '../email/mailer';
import {
  passwordResetEmailTemplate,
  verificationEmailTemplate,
} from '../email/templates';
import { mailLogger } from '../tools/logger';

config({ path: new URL('../.env', import.meta.url).pathname });

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      const { subject, text, html } = passwordResetEmailTemplate(url);
      await sendMail({ to: user.email, subject, text, html });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { subject, text, html } = verificationEmailTemplate(url);
      await sendMail({ to: user.email, subject, text, html });
    },
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
