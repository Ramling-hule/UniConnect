import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err));

// Immediately attempt to connect the client. connect() returns a promise;
// if the environment (or Node version) doesn't support top-level await, call
// connect() and log errors here so the rest of the app can use the client.
const initRedis = async () => {
    try {
        // If the client is already open this is a no-op
        await redisClient.connect();
        console.log('Redis client connected');
    } catch (err) {
        console.error('Redis connection error', err);
    }
};

// Start connecting in background when this module is imported.
initRedis();

export default redisClient;
