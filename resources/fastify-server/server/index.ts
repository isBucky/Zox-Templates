import { jsonReviver } from '@utils/helpers/json-reviver';
import { zodParser } from '@utils/validations/zod';
import MainRouter from './routes/main.routes';
import Config from '@config';
import env from '@env';

import Fastify, { type FastifyInstance } from 'fastify';
import Logger from '@suptreze/shared/logger';

// Middlewares
import SignedCookiesMiddleware from '@middlewares/handlers/signed-cookies';
import APIErrorHandler from '@middlewares/handlers/api-error';
import NotFoundHandler from '@middlewares/handlers/not-found';
import { KenaiPlugin, Router } from 'kenai';

import rateLimit from '@fastify/rate-limit';
import formbody from '@fastify/formbody';
import rawBody from 'fastify-raw-body';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';

export class Server {
    public app: FastifyInstance;


    constructor(public options?: ServerOptions) {
        this.app = Fastify({
            trustProxy: true,
            bodyLimit: 5242880, // 5 MB
            ignoreTrailingSlash: true,
            exposeHeadRoutes: false,
        });

        this.app.addContentTypeParser(
            'application/json',
            { parseAs: 'string' },
            (request, payload, done) => {
                try {
                    const data = JSON.parse(payload as any, jsonReviver);
                    return done(null, data);
                } catch (error) {
                    return done(error as Error);
                }
            },
        );

        this.app.setErrorHandler(APIErrorHandler);
        this.app.setNotFoundHandler(NotFoundHandler(this));
        this.hooks();
    }

    public get routes() {
        return Router.getData(MainRouter)!;
    }

    private hooks() {
        /**
         * Hook responsável pelas logs de requisição em modo de desenvolvimento
         */
        this.app.addHook('onResponse', (request, reply, done) => {
            done();

            if (
                !Config.get('isProduction') &&
                !request.routeOptions.schema?.hide &&
                !this.options?.noEmitLogs
            )
                Logger.info([request.method, reply.statusCode, request.url].join(' '), {
                    tags: ['Request'],
                });
        });
    }

    /**
     * Carga todos os middlewares
     */
    private async middlewares() {
        await this.app.register(rawBody, {
            field: 'rawBody',
            runFirst: true,
        });

        await this.app.register(cors, {
            origin: [
                'http://127.0.0.1:3000',
                'http://localhost:3000',
                'https://viden.digital',
                'https://test.viden.digital',
            ],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
            exposedHeaders: ['Content-Range', 'X-Content-Range'],
            preflightContinue: false,
            optionsSuccessStatus: 204,
        });

        await this.app.register(helmet, Config.get('helmetConfig'));
        await this.app.register(rateLimit, Config.get('rateLimitConfig'));
        await this.app.register(formbody);

        await this.app.register(cookie, {
            secret: env.COOKIE_SECRET,
            parseOptions: Config.get('cookieConfig'),
            hook: 'onRequest',
        });

        await this.app.register(SignedCookiesMiddleware);

        await this.app.register(KenaiPlugin, {
            routes: [MainRouter],
            controllerParameters: [this],
            customZodParser: zodParser as any,

            handler(data) {
                if (data.schema?.hide) return data;

                if (!data.schema?.tags?.length) {
                    let url = data.url.split('/');
                    url.splice(1, 1);

                    url = url.filter((i) => !i.includes(':'));
                    url = url.filter(Boolean);

                    (data['schema'] ?? {})['tags'] = url.length ? [url.join('/')] : undefined;
                }

                return data;
            },
        });
    }

    /**
     * Start the server by checking the Postgres connection, Redis connection,
     * loading middlewares, and listening on the specified port and host.
     */
    async start() {
        await this.middlewares();

        const address = await this.app.listen({ port: Config.get('port'), host: '0.0.0.0' });
        if (!this.options?.noEmitLogs) {
            Logger.info('Routes loaded:\n' + this.app.printRoutes(), { tags: ['Server'] });

            if (!Config.get('isProduction')) {
                Logger.info('Bull dashboard: ' + address + Config.get('bullDashboardPath'), {
                    tags: ['Server'],
                });

                Logger.info(`API Reference: ${address + Config.get('apiReferencePath')}`, {
                    tags: ['Server'],
                });
            }

            Logger.info(`Server is listening: ${address}`, { tags: ['Server'] });
        }

        return this.app;
    }
}

export interface ServerOptions {
    noEmitLogs?: boolean;
    disableAuth?: boolean;
    disableChecks?: boolean;
}
