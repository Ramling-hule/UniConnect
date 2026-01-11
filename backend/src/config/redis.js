import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL, {
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }, 
});

redis.on('connect', () => console.log('Redis Connected Successfully'));
redis.on('error', (err) => console.error('Redis Connection Error:', err));

export default redis;