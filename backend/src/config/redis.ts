import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
});

connection.on('error', (err) => {
  console.error('Redis error:', err);
});

connection.on('connect', () => {
  console.log('Redis connected');
});
