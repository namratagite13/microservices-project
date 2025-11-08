
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next)=>{
    logger.error(err.stack);
    res.status(err.status || 500).json({
        error:{
            message: err.message || 'An unexpected error occurred.',
        }

    });
}


module.exports = errorHandler;