import mongoose from 'mongoose';

/**
 * HackathonTeam — Bounded context: team management for a specific hackathon.
 *
 * Design decisions:
 *  - Members are stored as sub-documents with { userId, role } — never duplicating
 *    profile data. Always ref: 'User'.
 *  - Invitations are stored inline for O(1) lookup by userId.
 *  - Captain transfer is handled by updating captainId alone.
 *  - Team lock after deadline is enforced at service layer using this schema's lockedAt flag.
 */

const MemberSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:     { type: String, default: '' }, // self-declared role: 'Frontend Dev', 'ML Engineer' etc.
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const InviteSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  sentAt:    { type: Date, default: Date.now },
  expiresAt: { type: Date },
}, { _id: false });

const hackathonTeamSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  name:      { type: String, required: true, trim: true },
  captain:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  members:      [MemberSchema],
  invitations:  [InviteSchema],
  joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // For LFM (Looking For Members) discovery
  isLookingForMembers: { type: Boolean, default: false },
  rolesNeeded:         [{ type: String }],
  techStack:           [{ type: String }],

  // Team status lifecycle
  isLocked:    { type: Boolean, default: false },  // locked after registration deadline
  isSubmitted: { type: Boolean, default: false },

  // Chat room — reuses existing Group socket infrastructure
  // We store the groupId so the existing GroupChatWindow.js works immediately
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
}, { timestamps: true });

// ─── Indexes for 5M teams at scale ───────────────────────────────────────────
hackathonTeamSchema.index({ hackathon: 1, 'members.user': 1 });
hackathonTeamSchema.index({ hackathon: 1, captain: 1 });
hackathonTeamSchema.index({ hackathon: 1, isLookingForMembers: 1 });
hackathonTeamSchema.index({ 'invitations.user': 1, 'invitations.status': 1 });

export default mongoose.model('HackathonTeam', hackathonTeamSchema);
