import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // receiver is for DM, group is for Group Chat. One must be present.
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, 
  
  text: { type: String },
  fileUrl: { type: String }, // Cloudinary URL
  fileType: { type: String, enum: ['image', 'video', 'pdf', 'ppt', 'none'], default: 'none' },
  fileName: { type: String }, // Original name of the file
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Message', messageSchema);