import mongoose from 'mongoose';

const blacklistedTokenSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900, // 15 minutes, matching the access token lifetime
    },
  },
  { timestamps: false }
);

export const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);
