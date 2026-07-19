import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';

/**
 * PaymentService — Single Responsibility: Razorpay payment lifecycle.
 *
 * Design patterns applied:
 *  - Service Layer (SRP): All payment business logic lives here, not in the controller.
 *  - Dependency Inversion: Depends on env config abstraction, not process.env directly.
 *  - Facade: Wraps the Razorpay SDK behind a clean application-level interface.
 */
class PaymentService {
  constructor() {
    this._razorpay = new Razorpay({
      key_id:     env.razorpayKeyId     || process.env.RAZORPAY_KEY_ID     || 'dummy_key_id',
      key_secret: env.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    });
  }

  /**
   * Creates a Razorpay order and a corresponding Payment record.
   * @param {string} bookingId  - Booking _id
   * @param {string} userId     - The requesting user's _id
   * @returns {{ order: object, paymentId: string }}
   */
  async createOrder(bookingId, userId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      const err = new Error('Booking not found');
      err.status = 404;
      throw err;
    }
    if (booking.status !== 'Payment Pending') {
      const err = new Error('Booking is not in pending payment state');
      err.status = 400;
      throw err;
    }

    const options = {
      amount: booking.amount * 100, // paise
      currency: 'INR',
      receipt: `receipt_order_${booking._id}`,
      payment_capture: 1,
    };

    let order;
    try {
      order = await this._razorpay.orders.create(options);
    } catch {
      const err = new Error('Failed to create Razorpay order');
      err.status = 500;
      throw err;
    }

    const payment = new Payment({
      booking: booking._id,
      user: userId,
      razorpayOrderId: order.id,
      amount: booking.amount,
      status: 'created',
    });
    await payment.save();

    booking.payment = payment._id;
    await booking.save();

    return { order, paymentId: payment._id };
  }

  /**
   * Verifies a Razorpay payment signature and updates the DB accordingly.
   * @param {{ razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }} payload
   * @returns {{ success: boolean, meetingLink?: string }}
   */
  async verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId }) {
    const keySecret = env.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'captured',
        },
      );

      const booking = await Booking.findById(bookingId).populate('mentor');
      booking.status = 'Confirmed';
      booking.meetingLink = `https://meet.jit.si/ProConnect_${booking._id}`;
      await booking.save();

      return { success: true, meetingLink: booking.meetingLink };
    }

    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: 'failed' },
    );
    const err = new Error('Invalid payment signature');
    err.status = 400;
    throw err;
  }
}

export default new PaymentService();
