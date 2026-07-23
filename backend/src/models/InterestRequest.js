import mongoose from 'mongoose';

const InterestRequestSchema = new mongoose.Schema({
  teammateRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'TeammateRequest', required: true },
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'HackathonTeam' }, 
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

InterestRequestSchema.index({ teammateRequest: 1, status: 1 });
InterestRequestSchema.index({ user: 1, hackathon: 1 }, { unique: true }); // A user can only show interest once per hackathon team request

export default mongoose.model('InterestRequest', InterestRequestSchema);
