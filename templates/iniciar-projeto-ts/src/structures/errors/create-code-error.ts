import Mustache from 'mustache';

/**
 * This function creates an error object based on a JSON of errors.
 *
 * You can create an error that does not exist in the JSON by passing the `options` parameter.
 * If you do not pass the `options` parameter, the error will be searched in the JSON and the
 * respective information will be returned.
 *
 * @param errors - JSON of errors
 * @param code - Error code
 * @param options - Options for creating the error
 *
 * @returns - The error object
 */
export function createCodeError<T extends Record<string, ErrorBody>, K extends keyof T>(
    errors: T,
    code: K,
    options?: CreateCodeErrorOptions,
) {
    const error = errors[code];

    let status: number;
    let message: string;

    if (!error) {
        if (!options?.status)
            throw new Error(
                'To create an error that does not exist in the JSON, you must define the response status',
            );
        if (!options.message)
            throw new Error('To create a custom error, a message must be defined');

        status = options.status;
        message = options.message;
    } else {
        status = error.status;
        message = options?.message ?? error.message;
    }

    const mustacheRegex = /{{.*}}/gi;
    if (options?.mustache && mustacheRegex.test(message) && Object.keys(options?.mustache).length)
        message = Mustache.render(message, options.mustache);

    return {
        code: (code as string).toUpperCase(),
        message,
        status,

        cause: options?.cause,
        data: options?.data || {},
    };
}

export interface ErrorBody {
    status: number;
    message: string;
}

export interface ErrorReturned<T extends Record<string, ErrorBody>, K extends keyof T & string> {
    code: Uppercase<K>;
    message: string;
    status: number;
    data: any;
}

export interface CreateCodeErrorOptions {
    /**
     * Status of the error
     */
    status?: number;

    /**
     * Custom message to be sent
     */
    message?: string;

    /**
     * Additional data to be sent
     */
    data?: any;

    /**
     * Error cause
     */
    cause?: Error | any;

    /**
     * Mustache variables
     */
    mustache?: Record<string, string | number>;
}
