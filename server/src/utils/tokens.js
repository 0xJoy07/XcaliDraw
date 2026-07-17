import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RefreshToken } from '../models/RefreshToken.js';

import { requireEnv } from './env.js';

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() },
    requireEnv('JWT_ACCESS_SECRET'),
    { expiresIn: requireEnv('JWT_ACCESS_EXPIRES_IN') },
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString(), jti: crypto.randomUUID() },
    requireEnv('JWT_REFRESH_SECRET'),
    { expiresIn: requireEnv('JWT_REFRESH_EXPIRES_IN') },
  );
};

export const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const decodeRefreshTokenExpiration = (token) => {
  const decoded = jwt.decode(token);
  if (!decoded?.exp) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return new Date(decoded.exp * 1000);
};

export const persistRefreshToken = async (userId, token) => {
  const tokenHash = hashRefreshToken(token);
  try {
    await RefreshToken.create({
      user: userId,
      tokenHash,
      expiresAt: decodeRefreshTokenExpiration(token),
    });
  } catch (error) {
    if (error.code === 11000) {
      return tokenHash;
    }
    throw error;
  }
  return tokenHash;
};
