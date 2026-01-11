import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  institute: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin', 'institute'], default: 'student' },
  isVerified: { type: Boolean, default: false },
  badges: [{ type: String }],
  points: { type: Number, default: 0 },
    headline: { type: String }, // New field for profile
  location: { type: String }, // New field for profile
   connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invitations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// --- FIXED MIDDLEWARE HERE ---
// Removed 'next' because we are using async/await
userSchema.pre('save', async function () { 
  // If password is not modified, simply return (exits the function)
  if (!this.isModified('password')) return;

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);