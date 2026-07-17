import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { BlacklistedToken } from '../models/BlacklistedToken.js';

export const requireAuth = async (req, res, next) => {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Missing access token' });
    return;
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const isBlacklisted = await BlacklistedToken.exists({ tokenHash });
  
  if (isBlacklisted) {
    res.status(401).json({ message: 'Token has been revoked' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (_error) {
    res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return next();
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const isBlacklisted = await BlacklistedToken.exists({ tokenHash });

  if (isBlacklisted) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { userId: decoded.userId };
  } catch (_error) {
    // Ignore invalid tokens for optional auth
  }
  
  next();
};
