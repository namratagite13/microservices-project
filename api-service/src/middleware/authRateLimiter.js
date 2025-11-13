require('dotenv').config();
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const redisClient = new Redis(process.env.REDIS_URL);

const authRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // 20 requests max
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: 'Too many auth requests.' });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

module.exports = {authRateLimiter}