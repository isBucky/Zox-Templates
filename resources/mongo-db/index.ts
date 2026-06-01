import { URLs } from '@config';
import env from '@env';

import Logger from '@suptreze/shared/logger';
import mongoose from 'mongoose';

const mongooseOptions = {
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5_000,
    dbName: env.MONGODB_DATABASE_NAME,
};

let isConnected = false;

export default mongoose;

export async function connectMongo(disableLogs: boolean = false) {
    if (!isConnected) {
        try {
            await mongoose.connect(URLs.mongo, mongooseOptions);
            isConnected = true;

            if (!disableLogs) {
                Logger.info(`MongoDB connected to database`, {
                    tags: ['Mongo'],
                });
            }
        } catch (error: any) {
            throw Logger.error('Failed to connect to MongoDB', {
                tags: ['Mongo'],
                fatal: true,
                error,
            });
        }
    }

    return mongoose.connection.db;
}

export async function checkMongoConnection(disableLogs: boolean = false) {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error('MongoDB connection is not ready');
        }

        await mongoose.connection.db?.admin()?.ping();

        if (!disableLogs) {
            Logger.info('MongoDB is connected', { tags: ['Mongo'] });
        }

        return true;
    } catch (error: any) {
        throw Logger.error('MongoDB is not connected', {
            tags: ['Mongo'],
            fatal: true,
            error,
        });
    }
}

/**
 * Retorna a instância do `Db` do Mongoose.
 */
export function getDb() {
    if (!isConnected || !mongoose.connection.db) {
        throw Logger.error('MongoDB not connected. Call connectMongo() first.', { fatal: true });
    }

    return mongoose.connection.db;
}
