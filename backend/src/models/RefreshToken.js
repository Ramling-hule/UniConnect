import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  deviceInfo: {
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  parentTokenHash: { type: String },
  isUsed: { type: Boolean, default: false },
  isRevoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

refreshTokenSchema.index({ tokenHash: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('RefreshToken', refreshTokenSchema);
