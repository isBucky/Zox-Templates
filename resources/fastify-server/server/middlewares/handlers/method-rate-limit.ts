import { APIError } from '@errors';
import redis from '@redis';

import { getClientIp } from '@supercharge/request-ip';

// Types
import fastifyPlugin from 'fastify-plugin';

/**
 * Fastify plugin to rate limit requests by method, IP, and path.
 *
 * The plugin will throw an APIError if the request is rate limited.
 *
 * @example
 * fastify.register(methodRateLimit, { timeWindowMs: 5000 });
 */
export const methodRateLimit = fastifyPlugin(
    (fastify, _, done) => {
        const timeWindowMs = 1000;
        const timeWindowSeconds = Math.ceil(timeWindowMs / 1000);

        const sensitiveMethods = new Set(['POST', 'PUT', 'DELETE']);

        fastify.addHook('onRequest', async (request, reply) => {
            if (!sensitiveMethods.has(request.method)) return;

            const ip = getClientIp(request.raw) || request.ip || 'unknown';
            const routePath = request.url;

            const redisKey = [
                'rate-limit',
                'method',
                request.method.toLowerCase(),
                'ip',
                ip,
                'path',
                routePath,
            ].join(':');

            const alreadyExists = await redis.get(redisKey);
            if (alreadyExists) throw new APIError('RATE_LIMITED');

            await redis.setex(redisKey, timeWindowSeconds, '1');
            return;
        });

        return done();
    },
    { name: 'method-rate-limit' },
);
