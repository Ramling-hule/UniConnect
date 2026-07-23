import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  podId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pod',
    required: true,
    index: true
  },
  issueDate: {
    type: Date,
    default: Date.now
  },
  certificateUrl: {
    type: String,
    required: true
  },
  skillsAcquired: [{
    type: String
  }],
  finalScore: Number,
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

certificateSchema.index({ userId: 1, podId: 1 }, { unique: true });

export default mongoose.model('Certificate', certificateSchema);
