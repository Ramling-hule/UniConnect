import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "MentorService", required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    
    status: {
      type: String,
      enum: ["Pending", "Payment Pending", "Confirmed", "Cancelled", "Completed", "Refunded", "No Show", "Expired"],
      default: "Payment Pending"
    },
    
    meetingLink: { type: String }, // e.g., Jitsi Meet or Google Meet URL
    
    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    
    notes: { type: String }, // User's questions or context before meeting
    cancellationReason: { type: String }
  },
  { timestamps: true }
);

// To quickly query upcoming bookings
bookingSchema.index({ date: 1, startTime: 1 });

export default mongoose.model("Booking", bookingSchema);
