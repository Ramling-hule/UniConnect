const mongoose = require('mongoose');

const peerReviewSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    index: true
  },
  podId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pod',
    required: true,
    index: true
  },
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  revieweeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  feedback: {
    type: String,
    required: true
  },
  aiAnalyzed: {
    type: Boolean,
    default: false
  },
  sentimentScore: Number // Used for Gamification/Learning Score
}, {
  timestamps: true
});

peerReviewSchema.index({ assignmentId: 1, reviewerId: 1, revieweeId: 1 }, { unique: true });

module.exports = mongoose.model('PeerReview', peerReviewSchema);
