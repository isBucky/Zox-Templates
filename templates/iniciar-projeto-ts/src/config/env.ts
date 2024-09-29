import { isProduction } from './config';
import { z as zod } from 'zod';

const validation = zod.string().min(1);

export const EnvData = {
    NODE_ENV: zod.enum(['development', 'production']),
};

export default isProduction ? zod.object(EnvData) : zod.object(EnvData);
