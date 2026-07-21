import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    institute: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "admin", "institute", "mentor"],
      default: "student",
    },
    isVerified: { type: Boolean, default: false },
    badges: [{ type: String }],
    points: { type: Number, default: 0 },
    headline: { type: String },
    location: { type: String },
    about: { type: String },
    profilePicture: { type: String, default: "" },
    skills: [{ type: String }],
    experience: [{ type: mongoose.Schema.Types.Mixed }],
    education: [{ type: mongoose.Schema.Types.Mixed }],
    openToWork: { type: Boolean, default: false },
    openToCompete: { type: Boolean, default: false },
    visibility: { type: String, enum: ['PUBLIC', 'PRIVATE', 'CONNECTIONS_ONLY'], default: 'PUBLIC' },
    isOrganizer: { type: Boolean, default: false }, // Hackathon organizer permission flag
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    instituteName: { type: String },

    // Upgraded Security Verification Fields
    verificationCode: { type: String }, // Keep for backward compatibility
    verificationCodeExpires: { type: Date }, // Keep for backward compatibility
    verificationOtpHash: { type: String },
    verificationOtpExpires: { type: Date },
    verificationAttempts: { type: Number, default: 0 },

    // Password Reset
    passwordResetTokenHash: { type: String },
    passwordResetExpires: { type: Date },

    // Lockout Protection
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },

    // Token Versioning
    tokenVersion: { type: Number, default: 1 },

    // Google Auth
    googleId: { type: String, unique: true, sparse: true },

    // Multi-Factor Authentication
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    tempMfaToken: { type: String }
  },
  { timestamps: true }
);

userSchema.index({ verificationOtpHash: 1 }, { sparse: true });
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });


userSchema.pre("save", async function () {
  // If password is not modified, simply return (exits the function)
  if (!this.isModified("password")) return;

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
