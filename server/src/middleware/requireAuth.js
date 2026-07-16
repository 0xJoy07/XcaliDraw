import jwt from 'jsonwebtoken';

export const requireAuth = (req, res, next) => {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Missing access token' });
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

export const optionalAuth = (req, res, next) => {
  const header = req.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
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
