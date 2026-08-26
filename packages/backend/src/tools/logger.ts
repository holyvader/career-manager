import pino from 'pino';
import type { LokiOptions } from 'pino-loki';

const level = process.env.LOG_LEVEL ?? 'info';
const service = process.env.SERVICE_NAME ?? 'backend';
const lokiHost = process.env.LOKI_HOST;

function buildLogger(name: string, type: string) {
	const targets: pino.TransportTargetOptions[] = [
		{
			target: 'pino-pretty',
			level,
			options: { colorize: true, translateTime: 'SYS:standard' },
		},
	];

	// Only ship to Loki when configured, so local dev without docker-compose
	// running doesn't spam connection errors.
	if (lokiHost) {
		targets.push({
			target: 'pino-loki',
			level,
			options: {
				host: lokiHost,
				batching: { interval: 5 },
				labels: {
					type,
					service_name: service,
					env: process.env.NODE_ENV ?? 'development',
				},
				silenceErrors: true,
			} satisfies LokiOptions,
		});
	}

	return pino(
		{ level, name, base: { service_name: service, type } },
		pino.transport({ targets }),
	);
}

export const logger = buildLogger('GENERAL', 'GENERAL');
export const dbLogger = buildLogger('DB', 'DB');
export const apiLogger = buildLogger('API', 'API');
