import mongoose from 'mongoose';

const recommendationExplanationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true
  },
  explanationText: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
}, {
  timestamps: true
});
recommendationExplanationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
recommendationExplanationSchema.index({ userId: 1, mentorId: 1 }, { unique: true });

export default mongoose.model('RecommendationExplanation', recommendationExplanationSchema);
