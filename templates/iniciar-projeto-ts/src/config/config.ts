const env = process.env;

// Environments
export const port = Number(env.PORT) || 3e3;
export const isProduction = env.NODE_ENV === 'production';
// ------------
