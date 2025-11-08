/**
 * Middleware to extract the authenticated User ID passed from the API Gateway.
 * * Assumes: The API Gateway has already validated the JWT and injected the 
 * user's ID into the 'X-User-Id' header.
 * * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Next middleware function

 */

const logger = require('../utils/logger');
const authMiddleware = (req, res, next) => {
    // 1. Define the expected header name
    const userIdHeader = 'x-user-id'; // Headers are often converted to lowercase

    // 2. Extract the user ID from the trusted header
    const userId = req.headers[userIdHeader];

    // 3. Authorization Check: Ensure the trusted header is present
    if (!userId) {
        // This indicates a failed security check or a direct access attempt bypassing the Gateway.
        // It's a critical error in a microservices setup.
        logger.warn(`ERROR: Missing trusted header '${userIdHeader}' in request to Note Service.`);
        return res.status(403).json({ 
            message: "Access Denied: User identity not propagated.",
            errorCode: "IDENTITY_MISSING"
        });
    }

    // 4. Attach the user ID to the request object
    // Downstream controllers can now access it as req.userId
    req.userId = userId;

    // 5. Proceed to the next handler/controller
    next();
};

module.exports = {authMiddleware};