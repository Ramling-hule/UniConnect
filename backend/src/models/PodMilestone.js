const mongoose = require('mongoose');

const podMilestoneSchema = new mongoose.Schema({
  podId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pod',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  weekNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'],
    default: 'UPCOMING'
  },
  startDate: Date,
  endDate: Date,
  resources: [{
    title: String,
    url: String,
    type: { type: String, enum: ['VIDEO', 'ARTICLE', 'DOCUMENT', 'LINK'] }
  }]
}, {
  timestamps: true
});

podMilestoneSchema.index({ podId: 1, weekNumber: 1 });

module.exports = mongoose.model('PodMilestone', podMilestoneSchema);
