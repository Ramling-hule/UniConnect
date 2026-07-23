import mongoose from 'mongoose';

const podMemberSchema = new mongoose.Schema({
  podId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pod',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['STUDENT', 'GUEST_MENTOR', 'PRIMARY_MENTOR'],
    default: 'STUDENT'
  },
  status: {
    type: String,
    enum: ['INVITED', 'APPLIED', 'ACTIVE', 'LEFT', 'REMOVED'],
    default: 'ACTIVE'
  },
  learningScore: {
    type: Number,
    default: 0
  },
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: Date
}, {
  timestamps: true
});
podMemberSchema.index({ podId: 1, userId: 1 }, { unique: true });

export default mongoose.model('PodMember', podMemberSchema);
