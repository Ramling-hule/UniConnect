import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  action: { 
    type: String, 
    required: true,
    enum: [
      'REGISTRATION_ATTEMPT', 'REGISTRATION_SUCCESS',
      'EMAIL_VERIFICATION_SUCCESS', 'EMAIL_VERIFICATION_FAILED',
      'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'ACCOUNT_LOCKOUT',
      'PASSWORD_RESET_REQUESTED', 'PASSWORD_RESET_COMPLETED',
      'REFRESH_TOKEN_SUCCESS', 'REFRESH_TOKEN_REUSE_ATTEMPT',
      'LOGOUT_SUCCESS', 'LOGOUT_ALL_DEVICES', 'SESSION_REVOKED'
    ]
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Auto-delete records older than 90 days (7776000 seconds)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('AuditLog', auditLogSchema);
