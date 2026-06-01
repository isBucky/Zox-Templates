import { removeUndefinedProperties } from '@utils/helpers/objects';
import { LogErrorsRepository } from '@repo-nosql/log-errors';
import { notifyWebhook } from '@utils/notify-webhook';
import Config from '@config/config';
import { APIError } from '@errors';

import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { getClientIp } from '@supercharge/request-ip';
import { omit, pick } from '@suptreze/shared/functions';
import Logger from '@suptreze/shared/logger';
import { HttpStatusCode } from 'axios';

import { inspect } from 'node:util';
import crypto from 'node:crypto';

// Types
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

class APIErrorHandler {
    public errorId: string;

    constructor(
        public error: FastifyError,
        public request: FastifyRequest,
        public reply: FastifyReply,
    ) {
        this.errorId = crypto.createHash('sha1').update(inspect(error)).digest('hex').slice(0, 24);
    }

    public handler() {
        if (this.isWebSocketAttempt) {
            this.request.raw.socket.destroy();
            return;
        }

        if (this.error?.code == 'FST_ERR_CTP_INVALID_MEDIA_TYPE') return this.mediaTypeError();
        if (this.error['isAPIError']) return this.clientError();

        this.saveAndNotifyError();

        if (this.error['isResponseError']) return this.responseError();
        return this.reply
            .code(HttpStatusCode.InternalServerError)
            .send(
                pick(new APIError('OPERATION_FAILED', { data: { id: this.errorId } }).toObject(), [
                    'code',
                    'message',
                    'body',
                    'data',
                ]),
            );
    }

    public async saveAndNotifyError() {
        if (!Config.get('isProduction'))
            return Logger.error(this.error.message, {
                tags: ['Server Routers'],
                error: this.error,
            });

        const existingError = await LogErrorsRepository.get({ _id: this.errorId });
        const createFunction = () =>
            LogErrorsRepository.create(
                removeUndefinedProperties({
                    _id: this.errorId,

                    url: this.request.url,
                    method: this.request.method,

                    error: inspect(this.error),

                    headers: omit(this.request.headers, ['cookie', 'authorization']),
                    body: Object.keys(this.request.body ?? {}).length
                        ? this.request.body
                        : undefined,
                    params: Object.keys(this.request.params ?? {}).length
                        ? Object.assign({}, this.request.params)
                        : undefined,
                    query: Object.keys(this.request.query ?? {}).length
                        ? Object.assign({}, this.request.query)
                        : undefined,
                }) as any,
            );

        if (!existingError) {
            await createFunction();
        } else if (existingError.status !== 'pending') {
            await createFunction();
        }

        this.sendWebhookError();
    }

    public get isWebSocketAttempt() {
        const upgradeHeader = this.request.headers.upgrade;
        const connectionHeader = this.request.headers.connection;

        return (
            upgradeHeader &&
            upgradeHeader.toLowerCase() === 'websocket' &&
            connectionHeader &&
            connectionHeader.toLowerCase().includes('upgrade')
        );
    }

    public mediaTypeError() {
        return this.reply.code(HttpStatusCode.UnsupportedMediaType).send(
            pick(
                new APIError('CONTENT-TYPE', {
                    message:
                        'Unsupported media content for ' + this.request.headers['content-type'],
                    data: {
                        url: this.request.url,
                    },
                }).toObject(),
                ['code', 'message', 'data'],
            ),
        );
    }

    public clientError() {
        if (this.error instanceof SyntaxError)
            return this.reply.code(400).send({
                ...pick(new APIError('INVALID_JSON').toObject(), ['code']),
                message: this.error.message,
            });

        const apiError = this.error['toObject']();
        return this.reply.code(apiError.status).send(pick(apiError, ['code', 'message', 'data']));
    }

    public responseError() {
        return this.reply.code(HttpStatusCode.UnprocessableEntity).send(
            pick(
                new APIError('INVALID_RESPONSE', {
                    data: { id: this.errorId },
                }).toObject(),
                ['code', 'message', 'body', 'data'],
            ),
        );
    }

    public sendWebhookError() {
        notifyWebhook('errors', {
            username: 'API Viden Error',
            embeds: [
                new EmbedBuilder()
                    .setTitle('ID: ' + this.errorId)
                    .setDescription(
                        [
                            `**URL:** \`${this.request.url}\``,
                            `**Method:** \`${this.request.method}\``,
                            `**IP:** \`${getClientIp(this.request)}\``,
                            `**User-agent:** \`${this.request.headers['user-agent']}\`\n`,
                            '**Error message:** ' +
                                `\`\`\`js\n${(this.error.name ? this.error.name + ': ' : '') + this.error.message}\`\`\``,
                        ].join('\n'),
                    )
                    .setColor('Red')
                    .setTimestamp(),
            ],
            files: [
                new AttachmentBuilder(
                    Buffer.from(
                        JSON.stringify(
                            {
                                url: this.request.url,
                                method: this.request.method,
                                ip: getClientIp(this.request),
                                error: [
                                    this.error.name ? this.error.name + ': ' : '',
                                    this.error.message,
                                    this.error.stack ? this.error.stack : '',
                                ]
                                    .filter(Boolean)
                                    .join('\n'),
                                errorRaw: inspect(this.error),

                                headers: omit(this.request.headers, ['cookie', 'authorization']),
                                body: this.request.body,
                                params: this.request.params,
                                query: this.request.query,

                                createdAt: new Date(),
                            },
                            null,
                            2,
                        ),
                    ),
                ).setName('log.json'),
            ],
        });
    }
}

export default function handler(...args: [FastifyError, FastifyRequest, FastifyReply]) {
    return new APIErrorHandler(...args).handler();
}
