import { APIErrorCustom } from '@errors';

import { omit } from '@suptreze/shared/functions';
import { generateErrorMessage } from 'zod-error';
import { capitalizeFirstLetter } from 'bucky.js';
import z from 'zod';

import type { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import type { ZodType } from 'zod';

/**
 * Use this function to create validation middleware for routes
 *
 * @param name Name of the schema to use as a base
 * @param option Which option to check
 */
export function createMiddleware(
    schema: ZodType,
    objectName: keyof typeof OptionsToVerify,
    options?: ValidateOptions,
) {
    return (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {
        try {
            const objectNames = Object.values(OptionsToVerify);
            if (!objectNames || !objectNames.includes(objectName))
                return done(
                    new Error(
                        'ZodSchema - It was not possible to find the option to validate the Schema',
                    ),
                );

            const data = zodParser(schema, request[objectName]);
            if (objectName !== 'params' && options?.omitUnknownKeys !== false)
                request[objectName] = data;

            return done();
        } catch (error: any) {
            return done(error);
        }
    };
}

/**
 * Use essa função para fazer a validação dos schemas do zod,
 * com mensagens formatadas de fácil entendimento
 *
 * @param schema Schema do zod para ser verificado
 * @param data Valor a ser verificado pelo schema do zod
 */
export function zodParser<T extends ZodType>(schema: T, data: unknown): z.infer<T> {
    const schemaParsed = schema.safeParse(data);
    if (schemaParsed.success) return schemaParsed.data;

    const message = generateErrorMessage(<any>schemaParsed.error.issues, {
        maxErrors: 1,
        path: {
            enabled: true,
            type: 'objectNotation',
            transform: ({ value }) => (value.length ? value : ''),
        },
        code: {
            enabled: true,
            transform: ({ value }) => value,
        },
        message: {
            enabled: true,
            transform: ({ value }) => value,
        },

        transform({ codeComponent, messageComponent, pathComponent }) {
            return [
                codeComponent === 'custom'
                    ? undefined
                    : capitalizeFirstLetter(codeComponent.replace(/_/gi, ' ')),

                `${codeComponent === 'custom' ? 'P' : 'p'}roperty${
                    pathComponent.length ? ` "${pathComponent}"` : ''
                }.`,

                messageComponent,
            ]
                .filter(Boolean)
                .join(' ');
        },
    });

    throw new APIErrorCustom(schemaParsed.error.issues[0].code.toUpperCase(), {
        status: 400,
        message,
        data: omit(schemaParsed.error.issues[0], ['code', 'message']),
    });
}

export function parseSchema(schema: ZodType, data: any) {
    return zodParser(schema, data);
}

export interface ValidateOptions {
    /**
     * Se você deseja que ele não remova as chaves estranhas do objeto, define como false
     *
     * @default true
     */
    omitUnknownKeys?: boolean;
}

enum OptionsToVerify {
    'body',
    'params',
    'query',
}
