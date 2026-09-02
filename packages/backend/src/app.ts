import { config } from 'dotenv';
import { Elysia } from 'elysia';
import { prisma } from './db/prismaClient';
import { edenApp } from './edenApp';
import { protectedRoutes } from './routes/protected';
import { apiLogger, dbLogger } from './tools/logger';

config({ path: new URL('../.env', import.meta.url).pathname });

try {
  await prisma.$connect();
  dbLogger.info('Database connection OK');
} catch (error) {
  dbLogger.error({ err: error }, 'Failed to connect to the database');
}

export const app = new Elysia()
  .use(edenApp)
  .onRequest(({ request }) => {
    apiLogger.info(
      { method: request.method, path: new URL(request.url).pathname },
      'incoming request',
    );
  })
  .use(protectedRoutes);

app.listen(3334);

apiLogger.info(
  { hostname: app.server?.hostname, port: app.server?.port },
  'Carrer Manager Backend is running',
);
