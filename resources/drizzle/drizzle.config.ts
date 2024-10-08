import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/config/db/schemas/index.ts',
    out: './src/config/db/migrations',

    dialect: 'postgresql',

    dbCredentials: {
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME,
        port: Number(process.env.DATABASE_PORT ?? 5432),
    },
});
