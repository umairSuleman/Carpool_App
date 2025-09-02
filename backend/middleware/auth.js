import authService from '../services/authService.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false,
            error: 'Access denied. No valid token provided.' 
        });
        }
        
        const token = authHeader.replace('Bearer ', '');
        const decoded = authService.verifyToken(token);
        
        const user = await authService.findUserById(decoded.userId);
        if (!user) {
        return res.status(401).json({ 
            success: false,
            error: 'Invalid token. User not found.' 
        });
        }
        
        if (!user.is_verified) {
        return res.status(401).json({ 
            success: false,
            error: 'Please verify your email.' 
        });
        }
        
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
            success: false,
            error: 'Token expired' 
        });
        } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
            success: false,
            error: 'Invalid token' 
        });
        }
        res.status(401).json({ 
        success: false,
        error: 'Authentication failed' 
        });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user){
            return res.status(401).json({ 
                success: false,
                error: 'Authentication required' 
            });
        }
        
        if (!roles.includes(req.user.role)){
            return res.status(403).json({ 
                success: false,
                error: 'Insufficient permissions for this resource' 
            });
        }
        
        next();
    };
};

export const rateLimitAuth = (windowMs = 15 * 60 * 1000, max = 5) => {
    const attempts = new Map();
    
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!attempts.has(ip)) {
            attempts.set(ip, []);
        }
        
        const ipAttempts = attempts.get(ip).filter(time => time > windowStart);
        
        if (ipAttempts.length >= max) {
            return res.status(429).json({
                success: false,
                error: 'Too many authentication attempts. Please try again later.'
            });
        }
        
        ipAttempts.push(now);
        attempts.set(ip, ipAttempts);
        
        next();
    };
};