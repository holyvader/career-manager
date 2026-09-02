import { Elysia } from 'elysia';
import { meRoutes } from './protected/me';
import { tagRoutes } from './protected/tag';

export const protectedRoutes = new Elysia().use(meRoutes).use(tagRoutes);
