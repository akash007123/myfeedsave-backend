const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ message: 'No token provided' });
        }

        // Check if the header has the correct format
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        // Extract the token (remove 'Bearer ' from the string)
        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        try {
            // Verify the token using the secret from .env
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Attach the userId to the request object
            req.userId = decoded.userId;
            
            // Log for debugging
            console.log('Auth Middleware - User authenticated:', req.userId);
            
            // Continue to the next middleware/route handler
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({ message: 'Invalid token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ message: 'Internal server error in auth middleware' });
    }
};

module.exports = authMiddleware; 