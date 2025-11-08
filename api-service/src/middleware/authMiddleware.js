
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');


function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Access attempt with missing or malformed header!');
       
        return res.status(401).json({
            message: 'Authentication required: Token is missing or invalid format.',
            success: false
        });
    };

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            
            logger.warn('Invalid token.');
            return res.status(401).json({
                message: 'Invalid token or token expired.',
                success: false
            });
        };

        req.user = user;
        next();
    });
}

module.exports = { authMiddleware };
