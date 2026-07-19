import mongoose from 'mongoose';

/**
 * HackathonRegistration — Tracks per-participant registration state.
 *
 * Design decisions:
 *  - One document per (hackathon, user) pair — unique index enforces no double registration.
 *  - registrationType distinguishes solo vs. team registrations.
 *  - Payment is handled via ref to Payment collection — never inline.
 *  - Waitlist and approval workflow are pure status fields — no duplicate logic.
 */
const hackathonRegistrationSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team:      { type: mongoose.Schema.Types.ObjectId, ref: 'HackathonTeam', default: null },

  registrationType: { type: String, enum: ['individual', 'team'], default: 'individual' },

  // ── Registration lifecycle
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected'],
    default: 'pending',
  },

  // ── Payment (null if hackathon is free)
  payment:       { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  paymentStatus: { type: String, enum: ['not_required', 'pending', 'paid', 'refunded'], default: 'not_required' },

  // ── Organizer approval (only populated if hackathon.approvalRequired)
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },

  // ── Waitlist position (populated only if status === 'waitlisted')
  waitlistPosition: { type: Number, default: null },

  // ── Attendance (marked during the event)
  checkedIn:   { type: Boolean, default: false },
  checkInTime: { type: Date, default: null },

  // ── Certificate
  certificateIssued: { type: Boolean, default: false },
  certificateUrl:    { type: String, default: null },

  // ── Metadata
  submittedAt: { type: Date, default: Date.now },

}, { timestamps: true });

// ─── Indexes ──────────────────────────────────────────────────────────────────
hackathonRegistrationSchema.index({ hackathon: 1, user: 1 }, { unique: true }); // no double registration
hackathonRegistrationSchema.index({ hackathon: 1, status: 1 });
hackathonRegistrationSchema.index({ user: 1, status: 1 });
hackathonRegistrationSchema.index({ hackathon: 1, waitlistPosition: 1 }, { sparse: true });
hackathonRegistrationSchema.index({ team: 1 }, { sparse: true });

export default mongoose.model('HackathonRegistration', hackathonRegistrationSchema);
