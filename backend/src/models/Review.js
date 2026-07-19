import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
    
    rating: { type: Number, required: true, min: 1, max: 5 },
    reviewText: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    
    helpfulVotes: { type: Number, default: 0 },
    mentorReply: { type: String }
  },
  { timestamps: true }
);

// A user can only review a specific booking once
reviewSchema.index({ booking: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
