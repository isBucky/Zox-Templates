import fastifyPlugin from 'fastify-plugin';

/**
 * This middleware is responsible for updating the rate limit of a request
 * by IP.
 *
 * This middleware works with another middleware that is added to the route, so
 * it will create and validate the rate limit of each request.
 */
const RateLimitPerIpHandler = fastifyPlugin(
    (fastify, _: any, done) => {
        fastify.decorateRequest('rateLimitPerIp');

        fastify.addHook('onResponse', async (request, reply) => {
            if (!request.rateLimitPerIp || reply.statusCode < 200 || reply.statusCode >= 300)
                return done();

            await request.rateLimitPerIp.update();
            return;
        });

        return done();
    },
    { name: 'rate-limit-per-ip' },
);

export default RateLimitPerIpHandler;
