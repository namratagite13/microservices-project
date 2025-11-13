require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const logger = require('./utils/logger');
const helmet = require('helmet');
const cors = require('cors');
const Redis = require('ioredis');
const {RateLimiterRedis} = require('rate-limiter-flexible')
const noteRoutes = require('./routes/notesRoutes')
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
app.use(cors)
app.use(express.json());

app.use((req, res, next) =>{
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body, ${JSON.stringify(req.body)}`);
    next();
});

//Router
app.use('/api/notes', noteRoutes);

//error handler
app.use(errorHandler);

app.listen(PORT, () =>{
    logger.info(`Notes service running on port:${PORT}`)
});

process.on('unhandledRejection', (reason, promise) =>{
    logger.error("Unhandled Rejection at", promise, "reason:", reason)
});