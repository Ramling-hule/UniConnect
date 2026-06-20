import { createClient } from 'redis';
import { env } from './env.js';

// Limit retries so the process doesn't hang forever when Redis is unreachable
const redisClient = createClient({
    url: env.redisUrl,
    socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
            if (retries >= 3) {
                console.warn('⚠️  Redis: giving up after 3 retries. Sessions will use memory store.');
                return false; // stop retrying — prevents infinite loop
            }
            return Math.min(retries * 500, 2000);
        }
    }
});

redisClient.on('error', (err) => {
    // Only log the message, not the full stack — keeps output clean
    console.warn('Redis unavailable:', err.message);
});
redisClient.on('connect', () => console.log('✅ Redis client connected'));

const initRedis = async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.warn('⚠️  Redis not reachable — running without Redis (memory sessions).');
    }
};

initRedis();

export default redisClient;
