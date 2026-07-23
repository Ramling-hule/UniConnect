import mongoose from 'mongoose';

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
  description: { type: String, trim: true, default: '' },
  captain:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['active', 'locked', 'deleted'], default: 'active' },
  maxMembers: { type: Number, default: 4 },

  members:      [MemberSchema],
  invitations:  [InviteSchema],
  joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isLookingForMembers: { type: Boolean, default: false },
  rolesNeeded:         [{ type: String }],
  techStack:           [{ type: String }],
  isLocked:    { type: Boolean, default: false },  // locked after registration deadline
  isSubmitted: { type: Boolean, default: false },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
}, { timestamps: true });
hackathonTeamSchema.index({ hackathon: 1, 'members.user': 1 });
hackathonTeamSchema.index({ hackathon: 1, captain: 1 });
hackathonTeamSchema.index({ hackathon: 1, isLookingForMembers: 1 });
hackathonTeamSchema.index({ 'invitations.user': 1, 'invitations.status': 1 });

export default mongoose.model('HackathonTeam', hackathonTeamSchema);
