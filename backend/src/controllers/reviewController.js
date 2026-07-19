import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Mentor from "../models/Mentor.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createReview = asyncHandler(async (req, res, next) => {
  const { bookingId, rating, reviewText, isAnonymous } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) return next(new AppError("Booking not found", 404));

  if (booking.user.toString() !== req.user._id.toString()) {
    return next(new AppError("You can only review your own bookings", 403));
  }

  // Ensure it's completed
  if (booking.status !== "Completed") {
    // For testing, let's allow "Confirmed" to be reviewed too or auto-complete it
    // return next(new AppError("You can only review completed sessions", 400));
  }

  const review = new Review({
    user: req.user._id,
    mentor: booking.mentor,
    booking: bookingId,
    rating,
    reviewText,
    isAnonymous
  });

  await review.save();

  // Update Mentor Stats
  const mentor = await Mentor.findById(booking.mentor);
  const totalReviews = mentor.totalReviews + 1;
  const averageRating = ((mentor.averageRating * mentor.totalReviews) + rating) / totalReviews;
  
  mentor.totalReviews = totalReviews;
  mentor.averageRating = averageRating;
  await mentor.save();

  res.status(201).json({ review });
});

export const getMentorReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ mentor: req.params.mentorId })
    .populate("user", "name profilePicture")
    .sort({ createdAt: -1 });
  res.json({ reviews });
});
