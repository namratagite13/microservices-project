
const logger = require('../utils/logger');

const identityCheckMiddleware = (req, res, next) => {
    
    const userIdHeader = 'x-user-id'; // Headers are often converted to lowercase
    const userId = req.headers[userIdHeader];

    if (!userId) {
        logger.warn(`ERROR: Missing trusted header '${userIdHeader}' in request to Note Service.`);
        return res.status(403).json({ 
            message: "Access Denied: User identity not propagated.",
            errorCode: "IDENTITY_MISSING"
        });
    }

   
    req.userId = userId;
    next();
};

module.exports = {identityCheckMiddleware}; 