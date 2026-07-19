import mongoose from 'mongoose';

// ─── Sub-document schemas ─────────────────────────────────────────────────────

const PrizeSchema = new mongoose.Schema({
  rank:        { type: String, required: true }, // e.g., '1st', '2nd', 'Best UI'
  title:       { type: String, required: true },
  amount:      { type: Number, default: 0 },
  description: { type: String },
}, { _id: false });

const TrackSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  skills:      [{ type: String }],
}, { _id: false });

const JudgingCriteriaSchema = new mongoose.Schema({
  criterion: { type: String, required: true },
  weight:    { type: Number, default: 0 }, // percentage weight (0-100)
}, { _id: false });

const FaqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer:   { type: String, required: true },
}, { _id: false });

const SponsorSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  logo:    { type: String },
  website: { type: String },
  tier:    { type: String, enum: ['title', 'gold', 'silver', 'bronze', 'community'], default: 'community' },
}, { _id: false });

// ─── Main Schema ──────────────────────────────────────────────────────────────

const hackathonSchema = new mongoose.Schema({
  // ── Identity
  title:       { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  tagline:     { type: String },
  banner:      { type: String },   // Cloudinary URL — uses existing upload service

  // ── Organizer (references existing User, isOrganizer: true)
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ── Classification
  category:   { type: String, required: true },              // e.g., 'Web Dev', 'AI/ML', 'Blockchain'
  skills:     [{ type: String }],                            // skill tags for search
  mode:       { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'open'], default: 'open' },

  // ── Eligibility
  eligibility: {
    college:      { type: String },    // restrict by college name (empty = open to all)
    minYear:      { type: Number },
    maxYear:      { type: Number },
    openToPublic: { type: Boolean, default: true },
  },

  // ── Timeline
  timeline: {
    registrationOpen:  { type: Date, required: true },
    registrationClose: { type: Date, required: true },
    hackathonStart:    { type: Date, required: true },
    hackathonEnd:      { type: Date, required: true },
    resultAnnouncement:{ type: Date },
  },

  // ── Team Configuration
  minTeamSize: { type: Number, default: 1 },
  maxTeamSize: { type: Number, default: 4 },
  soloAllowed: { type: Boolean, default: true },

  // ── Registration
  maxParticipants:   { type: Number, default: null },  // null = unlimited
  registrationCount: { type: Number, default: 0 },     // denormalized for fast queries
  waitlistEnabled:   { type: Boolean, default: false },
  approvalRequired:  { type: Boolean, default: false }, // organizer must approve registrations

  // ── Payment
  isFree:          { type: Boolean, default: true },
  registrationFee: { type: Number, default: 0 },       // in INR, ignored if isFree
  currency:        { type: String, default: 'INR' },

  // ── Content
  tracks:          [TrackSchema],
  prizes:          [PrizeSchema],
  judgingCriteria: [JudgingCriteriaSchema],
  faqs:            [FaqSchema],
  sponsors:        [SponsorSchema],
  rules:           [{ type: String }],
  resources:       [{ url: String, label: String }],

  // ── Certificates
  certificateEnabled: { type: Boolean, default: false },
  certificateTemplate:{ type: String }, // Cloudinary URL

  // ── Status & Visibility
  status:     { type: String, enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'], default: 'draft' },
  visibility: { type: String, enum: ['public', 'private', 'unlisted'], default: 'public' },
  isFeatured: { type: Boolean, default: false },

  // ── Soft delete
  deletedAt: { type: Date, default: null },

}, { timestamps: true });

// ─── Indexes for 100K hackathons at scale ─────────────────────────────────────
hackathonSchema.index({ slug: 1 }, { unique: true });
hackathonSchema.index({ status: 1, visibility: 1, 'timeline.registrationClose': 1 });
hackathonSchema.index({ skills: 1, category: 1 });
hackathonSchema.index({ isFeatured: -1, createdAt: -1 });
hackathonSchema.index({ organizer: 1 });
hackathonSchema.index({ mode: 1, difficulty: 1 });
hackathonSchema.index({ 'timeline.hackathonStart': 1 });
hackathonSchema.index({ deletedAt: 1 });
hackathonSchema.index({ isFree: 1, registrationFee: 1 });

// ─── Virtual: is registration open right now ──────────────────────────────────
hackathonSchema.virtual('isRegistrationOpen').get(function () {
  const now = Date.now();
  return (
    this.status === 'published' &&
    this.timeline.registrationOpen <= now &&
    this.timeline.registrationClose >= now
  );
});

export default mongoose.model('Hackathon', hackathonSchema);
