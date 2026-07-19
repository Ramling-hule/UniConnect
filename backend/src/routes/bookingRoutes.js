import express from "express";
import { createBooking, getUserBookings, getMentorBookings, cancelBooking } from "../controllers/bookingController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/user", protect, getUserBookings);
router.get("/mentor", protect, getMentorBookings);
router.patch("/:id/cancel", protect, cancelBooking);

export default router;
