import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { RefreshToken } from '../models/RefreshToken.js';

const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
};

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() },
    requireEnv('JWT_ACCESS_SECRET'),
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' },
  );
};

export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId: userId.toString() },
    requireEnv('JWT_REFRESH_SECRET'),
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' },
  );
};

export const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const decodeRefreshTokenExpiration = (token) => {
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
