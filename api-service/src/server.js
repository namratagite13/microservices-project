require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const proxy = require('express-http-proxy')
const logger = require('./utils/logger');
const Redis = require('ioredis');
const errorHandler = require('./middleware/errorHandler');
const {authMiddleware} = require('./middleware/authMiddleware');
const {authRateLimiter} = require('./middleware/authRateLimiter')
const app = express();
const PORT = process.env.PORT || 3000 

const redisClient = new Redis(process.env.REDIS_URL);


app.use(helmet());
app.use(express.json());
app.use(cors());

app.use((req, res, next)=>{
    //HTTP method  = req.method
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body, ${req.body}`);
    next();
});

app.get('/', (req, res) => {
    // This simple response will instantly confirm connectivity
    logger.info('Handling root / request, sending status check.');
    res.status(200).json({ 
        status: 'API Gateway is operational', 
        message: 'Ready to proxy requests to /v1/auth and /v1/notes',
        time: new Date().toISOString() 
    });
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
app.use('/v1/auth', authRateLimiter, proxy(process.env.USER_SERVICE_URL,{
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