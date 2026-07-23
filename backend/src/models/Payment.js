import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking:                { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    hackathonRegistration:  { type: mongoose.Schema.Types.ObjectId, ref: 'HackathonRegistration', default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    
    status: { type: String, enum: ["created", "authorized", "captured", "failed", "refunded"], default: "created" },
    
    receiptUrl: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
