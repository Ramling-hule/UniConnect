const mongoose = require('mongoose');

const mentorInterventionSchema = new mongoose.Schema({
  podId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pod',
    required: true,
    index: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    enum: ['FALLING_BEHIND', 'INACTIVE', 'POOR_PERFORMANCE', 'BEHAVIORAL', 'OTHER'],
    required: true
  },
  notes: String,
  actionTaken: {
    type: String,
    enum: ['MESSAGE_SENT', 'MEETING_SCHEDULED', 'PLAN_ADJUSTED', 'NO_ACTION'],
    required: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'RESOLVED'],
    default: 'OPEN'
  },
  resolvedAt: Date
}, {
  timestamps: true
});

mentorInterventionSchema.index({ podId: 1, status: 1 });
mentorInterventionSchema.index({ studentId: 1 });

module.exports = mongoose.model('MentorIntervention', mentorInterventionSchema);
