import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  persistRefreshToken,
} from '../utils/tokens.js';

const router = express.Router();
const refreshCookieName = process.env.REFRESH_COOKIE_NAME || 'refreshToken';

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});

const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  avatarUrl: user.avatarUrl,
  authProvider: user.authProvider,
});

const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request', issues: parsed.error.flatten().fieldErrors });
    return;
  }

  req.body = parsed.data;
  next();
};

const issueTokens = async (res, user) => {
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  await persistRefreshToken(user._id, refreshToken);
  res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);
  return accessToken;
};

router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const existing = await User.exists({ email: req.body.email });
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }

    const user = await User.create({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name,
      authProvider: 'local',
    });
    const accessToken = await issueTokens(res, user);

    res.status(201).json({ accessToken, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select('+password');
    if (!user || !user.password || !(await user.comparePassword(req.body.password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const accessToken = await issueTokens(res, user);
    res.json({ accessToken, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (_req, res) => {
  res.clearCookie(refreshCookieName, refreshCookieOptions);
  res.status(204).send();
});

router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies[refreshCookieName];
    if (!refreshToken) {
      res.status(401).json({ message: 'Missing refresh token' });
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (_error) {
      res.clearCookie(refreshCookieName, refreshCookieOptions);
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const oldHash = hashRefreshToken(refreshToken);
    let storedToken = await RefreshToken.findOneAndUpdate(
      { tokenHash: oldHash, user: decoded.userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
      { new: true }
    );

    if (!storedToken) {
      const existingRevoked = await RefreshToken.findOne({ tokenHash: oldHash, user: decoded.userId });
      
      if (!existingRevoked || existingRevoked.expiresAt <= new Date()) {
        res.clearCookie(refreshCookieName, refreshCookieOptions);
        res.status(401).json({ message: 'Refresh token is no longer valid' });
        return;
      }

      const isWithinGracePeriod = (new Date() - existingRevoked.revokedAt) < 3000;
      if (!isWithinGracePeriod) {
        res.clearCookie(refreshCookieName, refreshCookieOptions);
        res.status(401).json({ message: 'Refresh token reuse detected' });
        return;
      }

      const user = await User.findById(decoded.userId);
      if (!user) {
        res.clearCookie(refreshCookieName, refreshCookieOptions);
        res.status(401).json({ message: 'User no longer exists' });
        return;
      }

      res.json({ accessToken: generateAccessToken(user._id), user: sanitizeUser(user) });
      return;
    }

    if (storedToken.expiresAt <= new Date()) {
      res.clearCookie(refreshCookieName, refreshCookieOptions);
      res.status(401).json({ message: 'Refresh token is no longer valid' });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.clearCookie(refreshCookieName, refreshCookieOptions);
      res.status(401).json({ message: 'User no longer exists' });
      return;
    }

    const newRefreshToken = generateRefreshToken(user._id);
    const newHash = await persistRefreshToken(user._id, newRefreshToken);
    
    storedToken.replacedByTokenHash = newHash;
    await storedToken.save();

    res.cookie(refreshCookieName, newRefreshToken, refreshCookieOptions);
    res.json({ accessToken: generateAccessToken(user._id), user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    res.status(503).json({ message: 'Google OAuth is not configured' });
    return;
  }

  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login` }),
  async (req, res, next) => {
    try {
      await issueTokens(res, req.user);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth/callback`);
    } catch (error) {
      next(error);
    }
  },
);

router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    res.status(503).json({ message: 'GitHub OAuth is not configured' });
    return;
  }

  passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
});

router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login` }),
  async (req, res, next) => {
    try {
      await issueTokens(res, req.user);
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth/callback`);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
