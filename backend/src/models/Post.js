import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  // Legacy field — kept for backward compat with old posts
  image: { type: String },
  // New rich media object — populated for all new posts
  media: {
    url:              { type: String },
    resourceType:     { type: String, enum: ['image', 'video', 'raw'] }, // Cloudinary resource_type
    format:           { type: String }, // e.g. 'jpg', 'mp4', 'pdf', 'txt'
    originalFilename: { type: String },
    bytes:            { type: Number },
  },
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text:      String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  visibility: { type: String, enum: ['PUBLIC', 'PRIVATE', 'CONNECTIONS_ONLY'], default: 'PUBLIC' },
  // ── Hackathon extension: non-breaking, both fields default to null ──────────
  postType: {
    type: String,
    enum: ['regular', 'hackathon_lfm'],
    default: 'regular',
  },
  hackathonMeta: {
    hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', default: null },
    teamId:      { type: mongoose.Schema.Types.ObjectId, ref: 'HackathonTeam', default: null },
    rolesNeeded: [{ type: String }],
    techStack:   [{ type: String }],
  },
}, { timestamps: true });

postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ user: 1 });
postSchema.index({ postType: 1, createdAt: -1 }); // for hackathon LFM feed queries

export default mongoose.model('Post', postSchema);