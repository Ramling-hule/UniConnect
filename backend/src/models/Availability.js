import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  start: { type: String, required: true }, // format "HH:MM"
  end: { type: String, required: true }    // format "HH:MM"
}, { _id: false });

const availabilitySchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true, unique: true },
    timezone: { type: String, required: true, default: "Asia/Kolkata" },
    
    // Weekly Schedule
    weeklySchedule: {
      monday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      tuesday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      wednesday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      thursday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      friday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      saturday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      sunday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] }
    },
    
    // Specific dates where mentor is NOT available
    exceptions: [{ type: Date }],
    
    bufferTime: { type: Number, default: 10 }, // Minutes between sessions
    advanceNotice: { type: Number, default: 24 } // Minimum hours required to book
  },
  { timestamps: true }
);

export default mongoose.model("Availability", availabilitySchema);
