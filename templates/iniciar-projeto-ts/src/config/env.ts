import { zodParser } from '@utils/validations/zod';

import { z } from 'zod';

/**
 * Use para criar um validador de ID's
 */
export const idVerify = z
    .string()
    .min(1)
    .refine((val) => !isNaN(Number(val)))
    .refine((val) => Number.isInteger(Number(val)))
    .refine((val) => Number(val) >= 0);

const validation = z.string().min(1, 'The values must have at least 1 character');
const isProduction = process.env.NODE_ENV === 'production';

export const EnvSchema = z.object({
    AUDIOBOOK_KEY: validation,
    CERTIFICATE_KEY: validation,

    JWT_SECRET: validation,
    JWT_SECRET_TEMPORARY: validation,

    SESSION_SECRET: validation.max(64, 'The value must have at most 64 characters'),

    COOKIE_SECRET: validation
        .max(64, 'The value must have at most 64 characters')
        .transform((val) => Buffer.from(val, 'hex'))
        .refine((val) => val.length === 32, 'The value must be 32 bytes long'),

    SECRET_ENCRYPTION: validation,
    IV_SECRET: validation,

    MERCADO_PAGO_WEBHOOK_SIGNATURE: validation,
    MERCADO_PAGO_ACCESS_DEV: validation.optional(),
    MERCADO_PAGO_ACCESS: validation.optional(),

    STRIPE_ACCESS_PROD: validation,
    STRIPE_ACCESS_DEV: validation,
    STRIPE_WEBHOOK_SECRET: validation,

    HOSTINGER_EMAIL_USER: validation,
    HOSTINGER_EMAIL_PASS: validation,

    DATABASE_PASSWORD: validation,
    DATABASE_NAME: validation,
    DATABASE_USER: validation,
    DATABASE_HOST: validation,
    DATABASE_PORT: idVerify.transform((port) => Number(port)),

    MONGODB_USER: validation,
    MONGODB_PASSWORD: validation,
    MONGODB_PORT: idVerify.transform((port) => Number(port)),
    MONGODB_DATABASE: validation,
    MONGODB_DATABASE_NAME: validation,

    GOOGLE_API_KEY: validation,
    GOOGLE_CLIENT_ID: validation,
    GOOGLE_CLIENT_SECRET: validation,

    GITHUB_CLIENT_ID: validation,
    GITHUB_CLIENT_SECRET: validation,

    REDIS_PASSWORD: validation,

    PORT: idVerify.transform((port) => Number(port)).optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export default <z.infer<typeof EnvSchema>>(isProduction
    ? zodParser(
          EnvSchema.omit({ MERCADO_PAGO_ACCESS_DEV: true }).extend({
              MERCADO_PAGO_ACCESS: validation,
          }),
          process.env,
      )
    : zodParser(
          EnvSchema.omit({ MERCADO_PAGO_ACCESS: true }).extend({
              MERCADO_PAGO_ACCESS_DEV: validation,
          }),
          process.env,
      ));
