import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import MentorBusinessService from '../services/MentorBusinessService.js';

/**
 * mentorController — Thin HTTP adapter layer.
 *
 * SOLID applied:
 *  - SRP : controller only handles HTTP concerns (parse → delegate → respond → error).
 *  - DIP : depends on MentorBusinessService abstraction, not Mongoose models directly.
 */

// ─── ONBOARDING & PROFILE ─────────────────────────────────────────────────────

export const applyMentor = asyncHandler(async (req, res, next) => {
  try {
    const mentor = await MentorBusinessService.applyMentor(req.user._id, req.body);
    res.status(201).json({
      message: 'Mentor application submitted successfully. Waiting for admin approval.',
      mentor,
    });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

export const getMentorProfile = asyncHandler(async (req, res, next) => {
  try {
    const mentor = await MentorBusinessService.getMentorProfile(req.user._id);
    res.json({ mentor });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 404));
  }
});

export const updateMentorProfile = asyncHandler(async (req, res, next) => {
  try {
    const mentor = await MentorBusinessService.updateMentorProfile(req.user._id, req.body);
    res.json({ mentor });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

// ─── SERVICES (OFFERINGS) ─────────────────────────────────────────────────────

export const createService = asyncHandler(async (req, res, next) => {
  try {
    const service = await MentorBusinessService.createService(req.user._id, req.body);
    res.status(201).json({ service });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

export const updateService = asyncHandler(async (req, res, next) => {
  try {
    const service = await MentorBusinessService.updateService(req.params.id, req.body);
    res.json({ service });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

export const deleteService = asyncHandler(async (req, res, next) => {
  try {
    await MentorBusinessService.deleteService(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

export const getMentorServices = asyncHandler(async (req, res, next) => {
  const services = await MentorBusinessService.getMentorServices(req.params.id);
  res.json({ services });
});

// ─── AVAILABILITY ─────────────────────────────────────────────────────────────

export const updateAvailability = asyncHandler(async (req, res, next) => {
  try {
    const availability = await MentorBusinessService.updateAvailability(req.user._id, req.body);
    res.json({ availability });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

export const getAvailability = asyncHandler(async (req, res, next) => {
  try {
    const availability = await MentorBusinessService.getAvailability(req.params.id);
    res.json({ availability });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 404));
  }
});

// ─── PUBLIC DISCOVERY ─────────────────────────────────────────────────────────

export const getMentors = asyncHandler(async (req, res, next) => {
  const mentors = await MentorBusinessService.getMentors(req.query);
  res.json({ mentors });
});

export const getMentorDetails = asyncHandler(async (req, res, next) => {
  try {
    const mentor = await MentorBusinessService.getMentorDetails(req.params.id);
    res.json({ mentor });
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 404));
  }
});

// ─── DASHBOARD ANALYTICS ──────────────────────────────────────────────────────

export const getMentorDashboard = asyncHandler(async (req, res, next) => {
  try {
    const data = await MentorBusinessService.getMentorDashboard(req.user._id);
    res.json(data);
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});
