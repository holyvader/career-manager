import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { config } from 'dotenv';
import { prisma } from './db/prismaClient';

config({ path: new URL('../.env', import.meta.url).pathname });

export const auth = betterAuth({
	database: prismaAdapter(prisma, { provider: 'postgresql' }),
	emailAndPassword: {
		enabled: true,
	},
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,
	trustedOrigins: [process.env.FRONTEND_URL ?? 'https://localhost:3000'],
});
