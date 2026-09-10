import { Elysia } from 'elysia';
import { offerImportRoutes } from '../domains/job-offers/importController';
import { tagsController } from '../domains/tags/controller';
import { meRoutes } from './me';
export const protectedRoutes = new Elysia()
  .use(meRoutes)
  .use(tagsController)
  .use(offerImportRoutes);
