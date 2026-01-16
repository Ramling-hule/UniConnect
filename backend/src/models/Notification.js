import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional (e.g., system alerts)
  type: { 
    type: String, 
    enum: ['connection_request', 'connection_accepted', 'message', 'like', 'comment'], 
    required: true 
  },
  message: { type: String }, // Optional custom text
  isRead: { type: Boolean, default: false },
  link: { type: String }, // Where should clicking take them? (e.g., "/chat")
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);