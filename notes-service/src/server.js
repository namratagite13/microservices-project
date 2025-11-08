require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const logger = require('./utils/logger');
const helmet = require('helmet');
const cors = require('cors');
const {rateLimit} = require('express-rate-limit');
const Redis = require('ioredis');
const {RateLimiterRedis} = require('rate-limiter-flexible')
//const {RedisStore} = require('rate-limiter-redis');
const noteRoutes = require('./routes/notesRoutes')
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');


const app = express();
const PORT = process.env.PORT || 3002

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => logger.info('Connected to mongoDB.'))
    .catch((e) =>{
        logger.error('Mongodb connection error')})

const redisClient = new Redis(process.env.REDIS_URL);

//middleware
app.use(helmet());
// Allow configuring FRONTEND_URL in .env (comma separated) and fallback to common Vite ports
const NOTES_FRONTEND_URL = process.env.FRONTEND_URL || '';
const notesAllowedOrigins = [];
if (NOTES_FRONTEND_URL) {
    notesAllowedOrigins.push(...NOTES_FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean));
}
notesAllowedOrigins.push('http://localhost:5173', 'http://localhost:5174');

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (notesAllowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express.json());

app.use((req, res, next) =>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${JSON.stringify(req.body)}`);
    next();
});

// const sensitiveEndpointLimiter = rateLimit({
//     windowMs: 15* 60* 1000,
//     max: 50,
//     standardHeaders:true,
//     legacyHeaders: false,
//     handler: (req, res)  => {
//         logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
//         res.status(429).json({success: false, message: "Too many request"})
//     },
//     store: new RedisStore({
//         sendCommand: (...args) => redisClient.call(...args), // <-- This is likely the issue
//     })

// });

// //Apply this sensitive endpointLimiter to our router
// app.use('/api/auth/register', sensitiveEndpointLimiter);

//Router
app.use('/api/notes', noteRoutes);

//error handler
app.use(errorHandler);
app.use(cookieParser)

app.listen(PORT, () =>{
    logger.info(`Notes service running on port:${PORT}`)
});

process.on('unhandledRejection', (reason, promise) =>{
    logger.error("Unhandled Rejection at", promise, "reason:", reason)
});