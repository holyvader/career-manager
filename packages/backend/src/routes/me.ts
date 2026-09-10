import { Elysia } from 'elysia';
import { jobOffersController } from '../domains/job-offers/controller';
import { usersController } from '../domains/users/controller';
export const meRoutes = new Elysia()
  .use(usersController)
  .use(jobOffersController);
