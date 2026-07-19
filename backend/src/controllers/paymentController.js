import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import PaymentService from '../services/PaymentService.js';

/**
 * paymentController — Thin HTTP adapter layer.
 *
 * SOLID applied:
 *  - SRP : controller only handles HTTP concerns (parsing, responding, error forwarding).
 *  - DIP : depends on PaymentService abstraction, not Razorpay SDK directly.
 */

export const createOrder = asyncHandler(async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const result = await PaymentService.createOrder(bookingId, req.user._id);
    res.json(result);
  } catch (err) {
    return next(new AppError(err.message, err.status || 500));
  }
});

export const verifyPayment = asyncHandler(async (req, res, next) => {
  try {
    const result = await PaymentService.verifyPayment(req.body);
    res.json({ message: 'Payment verified successfully', meetingLink: result.meetingLink });
  } catch (err) {
    return next(new AppError(err.message, err.status || 500));
  }
});
