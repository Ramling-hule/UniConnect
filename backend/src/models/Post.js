import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String }, // Optional if image exists
  image: { type: String }, // Cloudinary URL
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });



export default mongoose.model('Post', postSchema);