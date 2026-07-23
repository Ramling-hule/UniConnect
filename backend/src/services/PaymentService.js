import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../config/env.js';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import HackathonRegistration from '../models/HackathonRegistration.js';
import Hackathon from '../models/Hackathon.js';
class PaymentService {
  constructor() {
    this._razorpay = new Razorpay({
      key_id:     env.razorpayKeyId     || process.env.RAZORPAY_KEY_ID     || 'dummy_key_id',
      key_secret: env.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    });
  }
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
  async createHackathonOrder(registrationId, userId) {
    const registration = await HackathonRegistration.findById(registrationId);
    if (!registration) {
      const err = new Error('Registration not found'); err.status = 404; throw err;
    }
    if (registration.user.toString() !== userId.toString()) {
      const err = new Error('Not authorized'); err.status = 403; throw err;
    }

    const hackathon = await Hackathon.findById(registration.hackathon);
    if (!hackathon) {
      const err = new Error('Hackathon not found'); err.status = 404; throw err;
    }

    const options = {
      amount:          hackathon.registrationFee * 100, // paise
      currency:        hackathon.currency || 'INR',
      receipt:         `hack_reg_${registration._id}`,
      payment_capture: 1,
    };

    let order;
    try {
      order = await this._razorpay.orders.create(options);
    } catch {
      const err = new Error('Failed to create Razorpay order'); err.status = 500; throw err;
    }

    const payment = new Payment({
      hackathonRegistration: registration._id,
      user: userId,
      razorpayOrderId: order.id,
      amount: hackathon.registrationFee,
      currency: hackathon.currency || 'INR',
      status: 'created',
    });
    await payment.save();

    registration.payment = payment._id;
    registration.paymentStatus = 'pending';
    await registration.save();

    return { order, paymentId: payment._id };
  }
  async verifyHackathonPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationId }) {

    const keySecret = env.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'captured' },
      );

      const registration = await HackathonRegistration.findById(registrationId);
      if (registration) {
        registration.status = 'confirmed';
        registration.paymentStatus = 'paid';
        await registration.save();
        await Hackathon.findByIdAndUpdate(registration.hackathon, { $inc: { registrationCount: 1 } });
      }

      return { success: true };
    }

    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { status: 'failed' },
    );
    const err = new Error('Invalid payment signature'); err.status = 400; throw err;
  }
}

export default new PaymentService();

