import { verify } from 'jsonwebtoken';
import { findById } from '../models/User';

export default async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Access denied' });
        }
        
        const decoded = verify(token, process.env.JWT_SECRET);
        const user = await findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        req.user = user;
        next();
    } 
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};