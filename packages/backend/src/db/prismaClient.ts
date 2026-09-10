import '../env';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from 'prisma/config';
import { PrismaClient } from '../../generated/prisma/client';

const connectionString = env('DATABASE_URL');
const caPath = process.env.DATABASE_SSL_CA_PATH;
const runtimeUrl = new URL(connectionString);
if (caPath) {
  // pg URL SSL options override the explicit ssl object. The migration CLI
  // still receives its own require/strict/sslcert parameters in the original URL.
  runtimeUrl.searchParams.delete('sslmode');
  runtimeUrl.searchParams.delete('sslrootcert');
  runtimeUrl.searchParams.delete('sslcert');
  runtimeUrl.searchParams.delete('sslaccept');
}
const adapter = new PrismaPg({
  connectionString: caPath ? runtimeUrl.toString() : connectionString,
  ...(caPath && {
    ssl: { ca: readFileSync(caPath, 'utf8'), rejectUnauthorized: true },
  }),
});
const prisma = new PrismaClient({ adapter });

export { prisma };
