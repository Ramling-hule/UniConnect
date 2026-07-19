import AppError from '../utils/AppError.js';
import Hackathon from '../models/Hackathon.js';

/**
 * hackathonGuards — Authorization middleware for the Hackathon module.
 *
 * SOLID applied:
 *  - SRP: Authorization is no longer the controller's responsibility.
 *         Controllers become pure HTTP adapters; guards enforce access rules.
 *  - OCP: New permission rules are new guard functions. Existing guards untouched.
 *  - DIP: Guards depend on `req.user` (injected by `protect` middleware), not on
 *         User model directly.
 *
 * Design Pattern: Chain of Responsibility (middleware chain)
 *  Each guard is a self-contained middleware that either passes (next()) or
 *  throws an AppError — composable without coupling.
 */

/**
 * requireOrganizer — Ensures the authenticated user has organizer-level access.
 * Applied at the route level so controllers never handle authorization.
 */
export const requireOrganizer = (req, res, next) => {
  if (!req.user.isOrganizer && req.user.role !== 'admin') {
    return next(new AppError('Only verified organizers can perform this action', 403));
  }
  next();
};

/**
 * requireHackathonOwner — Ensures the authenticated user is the organizer
 * of the hackathon identified by req.params.id.
 *
 * Attaches the hackathon to req.hackathon so the controller doesn't need to
 * fetch it again (avoids N+1 DB calls).
 */
export const requireHackathonOwner = async (req, res, next) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return next(new AppError('Hackathon not found', 404));

    if (hackathon.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized — you do not own this hackathon', 403));
    }

    req.hackathon = hackathon; // pass to next handler, avoiding a duplicate DB call
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * requireTeamCaptain — Ensures the authenticated user is the captain
 * of the team identified by req.params.teamId.
 */
export const requireTeamCaptain = async (req, res, next) => {
  try {
    const HackathonTeam = (await import('../models/HackathonTeam.js')).default;
    const team = await HackathonTeam.findById(req.params.teamId);
    if (!team) return next(new AppError('Team not found', 404));

    if (team.captain.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the team captain can perform this action', 403));
    }

    req.team = team; // attach for downstream use
    next();
  } catch (err) {
    next(err);
  }
};
