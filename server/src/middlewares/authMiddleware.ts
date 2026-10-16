// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = verified;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
};
