require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const proxy = require('express-http-proxy')
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const Redis = require('ioredis');
const {authMiddleware} = require('./middleware/authMiddleware')
const app = express();
const PORT = process.env.PORT || 3000

const redisClient = new Redis(process.env.REDIS_URL);


app.use(helmet());
app.use(express.json());

// Configure allowed frontend origins. You can set FRONTEND_URL (comma-separated) in .env
const FRONTEND_URL = process.env.FRONTEND_URL || '';
const allowedFrontendOrigins = [];
if (FRONTEND_URL) {
    allowedFrontendOrigins.push(...FRONTEND_URL.split(',').map(s => s.trim()).filter(Boolean));
}
// include common Vite dev ports by default
allowedFrontendOrigins.push('http://localhost:5173', 'http://localhost:5174');

app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (e.g., server-to-server, curl)
        if (!origin) return callback(null, true);
        if (allowedFrontendOrigins.indexOf(origin) !== -1) return callback(null, true);
        return callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // IMPORTANT for sending cookies and Authorization headers (like your JWT token)
}));

//rate limiting 
const newRateLimit = rateLimit({
    windowMs: 15*60*1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>{
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({success: false, message: 'Too many request.'})
    },
    store: new RedisStore ({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

app.use(newRateLimit);


//ensuring that every request, regardless of its destination, first passes through this logging step.
app.use((req, res, next)=>{
    //HTTP method  = req.method
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`);
    next();
});

const proxyOptions = {
    proxyReqPathResolver :(req) =>{
        return req.originalUrl.replace(/^\/v1/, '/api')
    },
    proxyErrorHandler: (err, res, next) =>{
        logger.error('Proxying error caught:',err);
        res.status(500).json({
            message: 'Internal server error', error: err.message
        });
    }
};

//setting proxy
app.use('/v1/auth', proxy(process.env.USER_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator:(proxyReqOpts, srcReq) =>{
        proxyReqOpts.headers['content-type'] = 'application/json'
        return proxyReqOpts
    },
    userResDecorator:(proxyRes, proxyResData, userReq, userRes)=>{
        logger.info('Response received from user service.')

        return proxyResData
    }

}));


app.use('/v1/notes', authMiddleware, proxy(process.env.NOTES_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers['Content-Type'] = 'application/json';
        // Add a check to make sure the user object exists
        if (srcReq.user && srcReq.user.userId) {
            proxyReqOpts.headers['x-user-id'] = srcReq.user.userId;
        } else {
            // Optional: Log a warning or handle this case more explicitly
            logger.warn('User ID not found on request, skipping x-user-id header.');
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from post service: ${proxyRes.statusCode}`);
        return proxyResData;
    },
}));

app.use(errorHandler);


app.listen(PORT, () =>{
    logger.info(`Api service is running on PORT:${PORT}`)
    logger.info(`User service is running on: ${process.env.USER_SERVICE_URL}`)
    logger.info(`Notes service is running on: ${process.env.NOTES_SERVICE_URL}`)
    logger.info(`Redis client is running on: ${process.env.REDIS_URL}`)
});