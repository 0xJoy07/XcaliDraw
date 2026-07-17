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
import crypto from 'crypto';
import { PasswordResetToken } from '../models/PasswordResetToken.js';
import { BlacklistedToken } from '../models/BlacklistedToken.js';
import { sendMail } from '../lib/mailer.ts';
import { passwordResetEmail } from '../emails/passwordReset.ts';
import { requireEnv } from '../utils/env.js';

const router = express.Router();
const refreshCookieName = requireEnv('REFRESH_COOKIE_NAME');

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  // strict would drop the cookie on the first API call after an OAuth redirect from an external site
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

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' },
});

const passwordSchema = z.string().min(8).max(128);

const registerSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: passwordSchema,
  name: z.string().trim().min(1).max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(1).max(128),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
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

const issueOauthToken = (user) => {
  return jwt.sign(
    { userId: user._id.toString(), type: 'oauth' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '5m' }
  );
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

router.post('/logout', async (req, res, next) => {
  try {
    const header = req.get('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      await BlacklistedToken.create({ tokenHash }).catch((err) => {
        // ignore dupe key if token was already blacklisted
        if (err.code !== 11000) throw err;
      });
    }

    res.clearCookie(refreshCookieName, refreshCookieOptions);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
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

      // StrictMode double-fires this on mount, don't want that treated as a replay attack
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

router.post('/oauth-exchange', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Missing token' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (decoded.type !== 'oauth') throw new Error('Invalid token type');
    } catch (e) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const accessToken = await issueTokens(res, user);
    res.json({ accessToken, user: sanitizeUser(user) });
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
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  async (req, res, next) => {
    try {
      const token = issueOauthToken(req.user);
      res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${token}`);
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
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login` }),
  async (req, res, next) => {
    try {
      const token = issueOauthToken(req.user);
      res.redirect(`${process.env.CLIENT_URL}/oauth/callback?token=${token}`);
    } catch (error) {
      next(error);
    }
  },
);
router.post('/forgot-password', forgotPasswordLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    
    // don't leak user existence
    const successMessage = "If an account exists for that email, we've sent a reset link.";

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: successMessage });
    }

    // clear existing reset tokens for this user
    await PasswordResetToken.updateMany(
      { user: user._id, used: false },
      { $set: { used: true } }
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordResetToken.create({
      user: user._id,
      tokenHash,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;
    
    // await but catch so email failure doesn't break the response
    try {
      await sendMail({
        to: user.email,
        subject: 'Reset your password',
        html: passwordResetEmail(resetLink),
        text: `We received a request to reset your password. This link expires in 15 minutes. Or copy and paste this URL into your browser: ${resetLink}`
      });
    } catch (emailError) {
      console.error('Failed to dispatch password reset email:', emailError);
      // swallow email errors, user gets generic success either way
    }

    res.status(200).json({ message: successMessage });
  } catch (error) {
    next(error);
  }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await PasswordResetToken.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetToken) {
      return res.status(400).json({ message: 'This link is invalid or has expired. Request a new one.' });
    }

    const user = await User.findById(resetToken.user);
    if (!user) {
      return res.status(400).json({ message: 'This link is invalid or has expired. Request a new one.' });
    }

    user.password = newPassword; // Mongoose middleware handles bcrypt hashing
    await user.save();

    resetToken.used = true;
    await resetToken.save();

    await RefreshToken.deleteMany({ user: user._id });

    res.status(200).json({ message: 'Password has been successfully reset.' });
  } catch (error) {
    next(error);
  }
});

export default router;
