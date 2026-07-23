import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  podId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pod',
    required: true,
    index: true
  },
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PodMilestone',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  totalPoints: {
    type: Number,
    default: 100
  },
  submissions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    repoUrl: String,
    submittedAt: Date,
    grade: Number,
    feedback: String
  }]
}, {
  timestamps: true
});

assignmentSchema.index({ podId: 1, dueDate: 1 });

export default mongoose.model('Assignment', assignmentSchema);
