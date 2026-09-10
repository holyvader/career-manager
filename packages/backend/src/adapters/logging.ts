import type { ServiceLogging } from '../shared/logger';
import { apiLogger, dbLogger } from '../tools/logger';
export const serviceLogging: ServiceLogging = { apiLogger, dbLogger };
