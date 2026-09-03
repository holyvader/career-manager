import { config } from 'dotenv';
import { Elysia } from 'elysia';
import { prisma } from './db/prismaClient';
import { edenApp } from './edenApp';
import { apiLogger, dbLogger } from './tools/logger';

config({ path: new URL('../.env', import.meta.url).pathname });

async function connectToDatabase(maxAttempts = 5, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect();
      dbLogger.info('Database connection OK');
      return;
    } catch (error) {
      dbLogger.error(
        { err: error, attempt, maxAttempts },
        'Failed to connect to the database',
      );
      if (attempt === maxAttempts) {
        dbLogger.error(
          'Exhausted database connection retries, exiting so the process can be restarted',
        );
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
}

await connectToDatabase();

export const app = new Elysia()
  .use(edenApp)
  .onRequest(({ request }) => {
    apiLogger.info(
      { method: request.method, path: new URL(request.url).pathname },
      'incoming request',
    );
  })
  .get('/health', async ({ status }) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch (error) {
      dbLogger.error({ err: error }, 'Health check failed');
      return status(503, { status: 'error' });
    }
  });

app.listen(3334);

apiLogger.info(
  { hostname: app.server?.hostname, port: app.server?.port },
  'Carrer Manager Backend is running',
);
