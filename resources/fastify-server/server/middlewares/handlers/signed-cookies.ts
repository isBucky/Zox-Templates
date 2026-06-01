import fastifyPlugin from 'fastify-plugin';

const SignedCookiesMiddleware = fastifyPlugin(
    (fastify, options, done) => {
        fastify.decorateRequest('signedCookies');
        fastify.decorateReply('signedCookies');

        fastify.addHook('onRequest', (request, reply, done) => {
            if (Object.keys(request.cookies ?? {}).length) {
                const cookies = Object.entries(request.cookies).reduce((acc, [key, value]) => {
                    if (!value) return acc;

                    const result = request.unsignCookie(value);
                    if (result.valid && result.value) acc[key] = result.value;

                    return acc;
                }, {});

                request.signedCookies = cookies;
                reply.signedCookies = cookies;
            } else request.signedCookies = {};

            return done();
        });

        return done();
    },
    {
        name: 'signed-cookies',
    },
);

export default SignedCookiesMiddleware;
