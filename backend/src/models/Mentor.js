import mongoose from "mongoose";

const mentorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    headline: { type: String, required: true },
    about: { type: String, required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    yearsOfExperience: { type: Number, required: true },
    skills: [{ type: String }],
    languages: [{ type: String }],
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String },
    resumeUrl: { type: String },
    identityProofUrl: { type: String },
    companyIdUrl: { type: String },
    videoIntroUrl: { type: String },
    isApproved: { type: Boolean, default: false },
    status: { type: String, enum: ["pending", "approved", "rejected", "suspended"], default: "pending" },
    totalSessions: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Mentor", mentorSchema);
