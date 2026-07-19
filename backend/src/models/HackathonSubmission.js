import mongoose from 'mongoose';

/**
 * HackathonSubmission — Versioned submission artifacts per team per hackathon.
 *
 * Design decisions:
 *  - A submission document is created once per team per hackathon.
 *  - All submission versions are stored inline in the `history` array for full audit.
 *  - The current/active submission is the last item in `history` (or the top-level fields).
 *  - Draft mode allows teams to save progress without "officially" submitting.
 *  - Deadline locking is enforced at the service layer — this schema stores the outcome.
 */

const SubmissionVersionSchema = new mongoose.Schema({
  githubUrl:  { type: String, default: null },
  demoVideo:  { type: String, default: null }, // Cloudinary URL or YouTube link
  pptUrl:     { type: String, default: null }, // Cloudinary URL
  pdfUrl:     { type: String, default: null }, // Cloudinary URL
  liveUrl:    { type: String, default: null }, // Deployed URL
  driveLink:  { type: String, default: null },
  notes:      { type: String, default: null },
  submittedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedAt:{ type: Date, default: Date.now },
  isDraft:    { type: Boolean, default: true },
}, { _id: true });

const hackathonSubmissionSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  team:      { type: mongoose.Schema.Types.ObjectId, ref: 'HackathonTeam', required: true },
  track:     { type: String, default: null }, // which track this submission is for

  // ── Active submission fields (mirror of latest history entry — for fast reads)
  githubUrl:  { type: String, default: null },
  demoVideo:  { type: String, default: null },
  pptUrl:     { type: String, default: null },
  pdfUrl:     { type: String, default: null },
  liveUrl:    { type: String, default: null },
  driveLink:  { type: String, default: null },
  notes:      { type: String, default: null },

  // ── Status
  isDraft:   { type: Boolean, default: true },
  isLocked:  { type: Boolean, default: false }, // true after deadline passes

  // ── Judging
  scores: [{
    judge:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score:    { type: Number },
    feedback: { type: String },
    scoredAt: { type: Date, default: Date.now },
  }],
  totalScore: { type: Number, default: null },
  rank:       { type: Number, default: null },
  isWinner:   { type: Boolean, default: false },
  prizeWon:   { type: String, default: null },

  // ── Full version history (append-only for audit trail)
  history: [SubmissionVersionSchema],

  // ── Final submission metadata
  finalSubmittedAt: { type: Date, default: null },
  finalSubmittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

}, { timestamps: true });

// ─── Indexes ──────────────────────────────────────────────────────────────────
hackathonSubmissionSchema.index({ hackathon: 1, team: 1 }, { unique: true }); // one submission per team
hackathonSubmissionSchema.index({ hackathon: 1, isWinner: 1 });
hackathonSubmissionSchema.index({ hackathon: 1, totalScore: -1 }); // leaderboard
hackathonSubmissionSchema.index({ team: 1 });

export default mongoose.model('HackathonSubmission', hackathonSubmissionSchema);
