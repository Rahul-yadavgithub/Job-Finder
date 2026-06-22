import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { connection as redisConnection } from '../config/redis';

const ipKeyGenerator = (req: any) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return ip.replace(/^::ffff:/, '');
};

// Global limit: 200 requests per 15 minutes per IP (5000 in dev)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  limit: process.env.NODE_ENV !== 'production' ? 5000 : 200, 
  standardHeaders: true, 
  legacyHeaders: false, 
  keyGenerator: ipKeyGenerator,
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisConnection.call(...args),
    prefix: 'rl:global:',
  }),
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// Login limit: 5 requests per 15 minutes per IP (50 in dev)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV !== 'production' ? 50 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisConnection.call(...args),
    prefix: 'rl:login:',
  }),
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes' },
});

// Register limit: 3 requests per hour per IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisConnection.call(...args),
    prefix: 'rl:register:',
  }),
  message: { success: false, message: 'Too many registration attempts, please try again after an hour' },
});

// Forgot password limit: 3 requests per hour per IP
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisConnection.call(...args),
    prefix: 'rl:forgot_pwd:',
  }),
  message: { success: false, message: 'Too many password reset requests, please try again after an hour' },
});

// Authenticated user limit: 1000 requests per 15 minutes per user ID (5000 in dev)
export const authenticatedUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV !== 'production' ? 5000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.user?.userId || req.admin?.userId || ipKeyGenerator(req); 
  },
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redisConnection.call(...args),
    prefix: 'rl:auth_user:',
  }),
  message: { success: false, message: 'Too many requests, please try again later' },
});
