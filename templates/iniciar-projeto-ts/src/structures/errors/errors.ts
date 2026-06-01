import { createCodeError, type CreateCodeErrorOptions, type ErrorBody } from './create-code-error';
import { omit, pick } from '@suptreze/shared/functions';
import Errors from './messages/common-errors.json';
import z from 'zod';

export const errorSchema = z
    .object({
        code: z.string().describe('The error code'),
        message: z.string().describe('The error message'),
        data: z.any().describe('Additional error data'),
    })
    .describe('The error object');

export class BaseError extends Error {
    public code!: string;
    public status!: number;
    public message!: string;
    public data!: any;
    public cause!: Error | any;

    public isAPIError = true;

    /**
     * Converts the error object into a plain object containing
     * the `code`, `status`, `message`, and `data` properties.
     */
    public toObject() {
        return pick(this as BaseError, ['code', 'status', 'message', 'data']);
    }
}

export class APIErrorCustom extends BaseError {
    constructor(code: string, options?: CreateCodeErrorOptions) {
        const error = createCodeError<any, string>({}, code, options);
        super(error.message);

        Object.assign(this, error);
    }
}

export class APIError<
    T extends typeof Errors,
    K extends keyof T['data'] & string,
> extends BaseError {
    constructor(code: K, options?: CreateCodeErrorOptions) {
        const error = createCodeError<T['data'], K>(Errors.data, code, options);
        super(error.message);

        Object.assign(this, error);
    }
}

export class CodeError<T extends typeof Errors, K extends keyof T['data'] & string> extends Error {
    constructor(code: K, options?: CreateCodeErrorOptions) {
        const error = createCodeError<T['data'], K>(Errors.data, code, options);
        super(error.message);

        Object.assign(this, omit(error, ['status']));
    }
}

export function createRepoError<T extends ErrorMetadata>(errors: T) {
    return class RepositoryError extends BaseError {
        constructor(code: keyof T['data'], options?: CreateCodeErrorOptions) {
            const error = createCodeError<T['data'], keyof T['data']>(errors.data, code, options);
            super(error.message);

            Object.assign(this, error);
        }
    };
}

export interface ErrorMetadata {
    data: Record<string, ErrorBody>;
}
