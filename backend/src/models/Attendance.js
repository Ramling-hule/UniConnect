const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  podId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pod',
    required: true,
    index: true
  },
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PodMilestone'
  },
  sessionId: {
    type: String,
    required: true // WebRTC session ID or Meeting ID
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  joinedAt: Date,
  leftAt: Date,
  durationMinutes: Number,
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT', 'EXCUSED'],
    default: 'PRESENT'
  }
}, {
  timestamps: true
});

attendanceSchema.index({ podId: 1, sessionId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
