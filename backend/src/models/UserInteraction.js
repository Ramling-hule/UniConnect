const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['VIEW', 'CLICK', 'BOOKMARK', 'BOOK', 'COMPLETE_SESSION', 'REJECT'],
    required: true
  },
  context: {
    query: String, // Search query if applicable
    recommendationVersion: String, // e.g., 'v1-heuristic', 'v2-xgboost'
    rankPosition: Number, // Where the mentor appeared in the list
    source: String // e.g., 'home_page_trending', 'search_results'
  },
  sessionDurationMinutes: Number, // For COMPLETE_SESSION action
  rating: Number // Explicit feedback if provided
}, {
  timestamps: true
});

// Index for ML aggregation and analytics queries
userInteractionSchema.index({ userId: 1, action: 1, createdAt: -1 });
userInteractionSchema.index({ mentorId: 1, action: 1 });

module.exports = mongoose.model('UserInteraction', userInteractionSchema);
