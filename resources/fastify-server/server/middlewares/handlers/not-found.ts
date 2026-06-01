import { omit } from '@suptreze/shared/functions';
import { APIError } from '@errors';
// Types
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Server } from '@/server';

/**
 * Handles 404 Not Found responses.
 *
 * If the request is a WebSocket upgrade attempt, destroys the socket immediately
 * to avoid ECONNRESET errors. Otherwise, sends a standard 404 response.
 *
 * @param server - The Fastify server instance.
 */
export default function NotFoundHandler(server: Server) {
    return (request: FastifyRequest, reply: FastifyReply) => {
        const route = Array.from(server.routes.values()).find((route) => route.url === request.url);
        const upgradeHeader = request.headers.upgrade;
        const connectionHeader = request.headers.connection;

        const isWebSocketAttempt =
            upgradeHeader &&
            upgradeHeader.toLowerCase() === 'websocket' &&
            connectionHeader &&
            connectionHeader.toLowerCase().includes('upgrade');

        if (isWebSocketAttempt) {
            request.raw.socket.destroy();
            return;
        }

        return reply.code(404).send(
            omit(
                new APIError(route ? 'METHOD_NOT_ALLOWED' : 'NOT_FOUND', {
                    data: {
                        url: request.url,
                    },
                }),
                ['status', 'isAPIError'],
            ),
        );
    };
}
