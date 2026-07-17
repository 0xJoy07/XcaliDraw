import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { requireEnv } from '../utils/env.js';
import { User } from '../models/User.js';

const upsertOAuthUser = async ({ provider, providerId, email, name, avatarUrl }) => {
  if (!email) {
    throw new Error(`${provider} account did not provide an email address`);
  }

  const normalizedEmail = email.toLowerCase();
  const existingByProvider = await User.findOne({ authProvider: provider, providerId });
  if (existingByProvider) return existingByProvider;

  const existingByEmail = await User.findOne({ email: normalizedEmail });
  if (existingByEmail) {
    existingByEmail.authProvider = provider;
    existingByEmail.providerId = providerId;
    existingByEmail.name = existingByEmail.name || name;
    existingByEmail.avatarUrl = existingByEmail.avatarUrl || avatarUrl;
    await existingByEmail.save();
    return existingByEmail;
  }

  return User.create({
    email: normalizedEmail,
    name,
    avatarUrl,
    authProvider: provider,
    providerId,
  });
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: requireEnv('GOOGLE_CALLBACK_URL'),
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const user = await upsertOAuthUser({
        provider: 'google',
        providerId: profile.id,
        email,
        name: profile.displayName,
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: requireEnv('GITHUB_CALLBACK_URL'),
    scope: ['user:email'],
  }, async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.find((item) => item.primary)?.value || profile.emails?.[0]?.value;
      const user = await upsertOAuthUser({
        provider: 'github',
        providerId: profile.id,
        email,
        name: profile.displayName || profile.username,
        avatarUrl: profile.photos?.[0]?.value,
      });
      done(null, user);
    } catch (error) {
      done(error);
    }
  }));
}
