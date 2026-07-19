import Booking from '../models/Booking.js';
import MentorServiceModel from '../models/MentorService.js';
import Mentor from '../models/Mentor.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import CacheService from '../services/CacheService.js';
import crypto from 'crypto';

/**
 * bookingController — Thin HTTP adapter layer.
 *
 * SOLID applied:
 *  - SRP : controller handles only HTTP concerns.
 *  - DIP : uses CacheService.acquireLock / releaseLock facade — never touches redisClient directly.
 *  - OCP : lock strategy can be changed in CacheService without touching this file.
 */

export const createBooking = asyncHandler(async (req, res, next) => {
  const { mentorId, serviceId, date, startTime, endTime, notes } = req.body;

  const service = await MentorServiceModel.findById(serviceId);
  if (!service) return next(new AppError('Service not found', 404));

  // Distributed lock to prevent double-booking (via CacheService facade)
  const lockKey   = `booking_lock:${mentorId}:${date}:${startTime}`;
  const lockValue = crypto.randomUUID();
  const acquired  = await CacheService.acquireLock(lockKey, lockValue, 120); // 2 min TTL

  if (!acquired) {
    return next(new AppError(
      'This slot is currently being booked by someone else. Please try again or choose another slot.',
      409,
    ));
  }

  try {
    // Double-check DB to guard against race conditions
    const existingBooking = await Booking.findOne({
      mentor: mentorId,
      date,
      startTime,
      status: { $in: ['Confirmed', 'Completed', 'Payment Pending'] },
    });

    if (existingBooking) {
      await CacheService.releaseLock(lockKey);
      return next(new AppError('This slot is already booked.', 409));
    }

    const platformFee = Math.round(service.price * 0.1); // 10% platform fee

    const booking = new Booking({
      user: req.user._id,
      mentor: mentorId,
      service: serviceId,
      date,
      startTime,
      endTime,
      amount: service.price,
      platformFee,
      notes,
      status: 'Payment Pending',
    });

    await booking.save();

    res.status(201).json({
      message: 'Booking initialized. Complete payment to confirm.',
      booking,
      lockKey,
      lockValue,
    });
  } catch (error) {
    await CacheService.releaseLock(lockKey);
    return next(error);
  }
});

export const getUserBookings = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('mentor', 'headline company')
    .populate('service', 'title')
    .sort({ date: 1 });
  res.json({ bookings });
});

export const getMentorBookings = asyncHandler(async (req, res, next) => {
  const mentor = await Mentor.findOne({ user: req.user._id });
  if (!mentor) return next(new AppError('Mentor profile not found', 404));

  const bookings = await Booking.find({ mentor: mentor._id })
    .populate('user', 'name email profilePicture')
    .populate('service', 'title')
    .sort({ date: 1 });
  res.json({ bookings });
});

export const cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new AppError('Booking not found', 404));

  if (booking.user.toString() !== req.user._id.toString()) {
    return next(new AppError('Not authorized to cancel this booking', 403));
  }

  booking.status = 'Cancelled';
  booking.cancellationReason = req.body.reason || 'User Cancelled';
  await booking.save();

  res.json({ message: 'Booking cancelled successfully' });
});
