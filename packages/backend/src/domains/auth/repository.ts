import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../../db/prismaClient';

// Better Auth owns account/session queries through this persistence adapter.
export const authDatabase = prismaAdapter(prisma, { provider: 'postgresql' });
