import { asyncHandler } from '../middlewares/asyncHandler.js';
import AppError from '../utils/AppError.js';
import HackathonService from '../services/HackathonService.js';
import HackathonTeamService from '../services/HackathonTeamService.js';
import HackathonSubmissionService from '../services/HackathonSubmissionService.js';
import PaymentService from '../services/PaymentService.js';

/**
 * hackathonController — Thin HTTP adapter layer.
 * All business logic delegated to HackathonService, HackathonTeamService,
 * HackathonSubmissionService, and PaymentService.
 * Reuses asyncHandler and AppError from existing middleware stack.
 */

// ─── DISCOVERY ────────────────────────────────────────────────────────────────

export const listHackathons = asyncHandler(async (req, res) => {
  const data = await HackathonService.listHackathons(req.query);
  res.json({ success: true, ...data });
});

export const getHackathon = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.getBySlug(req.params.slug);
  res.json({ success: true, hackathon });
});

// ─── ORGANIZER CRUD ───────────────────────────────────────────────────────────

export const createHackathon = asyncHandler(async (req, res) => {
  if (!req.user.isOrganizer && req.user.role !== 'admin') {
    throw new AppError('Only verified organizers can create hackathons', 403);
  }
  const hackathon = await HackathonService.create(req.user._id, req.body);
  res.status(201).json({ success: true, hackathon });
});

export const updateHackathon = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.update(req.params.id, req.user._id, req.body);
  res.json({ success: true, hackathon });
});

export const deleteHackathon = asyncHandler(async (req, res) => {
  await HackathonService.softDelete(req.params.id, req.user._id);
  res.json({ success: true, message: 'Hackathon cancelled successfully' });
});

// ─── REGISTRATION ─────────────────────────────────────────────────────────────

export const registerIndividual = asyncHandler(async (req, res) => {
  const registration = await HackathonService.registerIndividual(
    req.params.id, req.user._id, req.app.get('io'),
  );
  res.status(201).json({ success: true, registration });
});

export const cancelRegistration = asyncHandler(async (req, res) => {
  const reg = await HackathonService.cancelRegistration(req.params.registrationId, req.user._id);
  res.json({ success: true, registration: reg });
});

// ─── TEAM MANAGEMENT ──────────────────────────────────────────────────────────

export const createTeam = asyncHandler(async (req, res) => {
  const team = await HackathonTeamService.createTeam(
    req.params.id, req.user._id, req.body, req.app.get('io'),
  );
  res.status(201).json({ success: true, team });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const team = await HackathonTeamService.inviteMember(
    req.params.teamId, req.user._id, req.body.userId, req.app.get('io'),
  );
  res.json({ success: true, team });
});

export const acceptInvite = asyncHandler(async (req, res) => {
  const team = await HackathonTeamService.acceptInvite(
    req.params.teamId, req.user._id, req.app.get('io'),
  );
  res.json({ success: true, team });
});

export const rejectInvite = asyncHandler(async (req, res) => {
  const result = await HackathonTeamService.rejectInvite(req.params.teamId, req.user._id);
  res.json({ success: true, ...result });
});

export const leaveTeam = asyncHandler(async (req, res) => {
  const result = await HackathonTeamService.leaveTeam(
    req.params.teamId, req.user._id, req.app.get('io'),
  );
  res.json({ success: true, ...result });
});

export const transferCaptain = asyncHandler(async (req, res) => {
  const team = await HackathonTeamService.transferCaptain(
    req.params.teamId, req.user._id, req.body.newCaptainId,
  );
  res.json({ success: true, team });
});

export const discoverTeams = asyncHandler(async (req, res) => {
  const teams = await HackathonTeamService.discoverTeams(req.params.id, req.query);
  res.json({ success: true, teams });
});

// ─── SUBMISSIONS ──────────────────────────────────────────────────────────────

export const upsertSubmission = asyncHandler(async (req, res) => {
  const submission = await HackathonSubmissionService.upsertSubmission(
    req.params.id, req.params.teamId, req.user._id, req.body, req.app.get('io'),
  );
  res.json({ success: true, submission });
});

export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await HackathonSubmissionService.getSubmission(req.params.id, req.params.teamId);
  res.json({ success: true, submission });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await HackathonSubmissionService.getLeaderboard(req.params.id);
  res.json({ success: true, leaderboard });
});

// ─── PAYMENT ──────────────────────────────────────────────────────────────────

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const { registrationId } = req.body;
  const result = await PaymentService.createHackathonOrder(registrationId, req.user._id);
  res.json({ success: true, ...result });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const result = await PaymentService.verifyHackathonPayment(req.body);
  res.json({ success: true, ...result });
});

// ─── AI ───────────────────────────────────────────────────────────────────────

export const getAiTeamSuggestions = asyncHandler(async (req, res) => {
  const data = await HackathonService.getAiTeamSuggestions(req.params.id, req.user._id);
  res.json({ success: true, data });
});

export const getSkillGapAnalysis = asyncHandler(async (req, res) => {
  const data = await HackathonService.getSkillGapAnalysis(req.params.id, req.params.teamId);
  res.json({ success: true, data });
});

export const getProjectIdeas = asyncHandler(async (req, res) => {
  const { teamSkills } = req.body;
  const data = await HackathonService.getProjectIdeaSuggestions(req.params.id, teamSkills || []);
  res.json({ success: true, data });
});

// ─── ORGANIZER DASHBOARD ──────────────────────────────────────────────────────

export const getOrganizerDashboard = asyncHandler(async (req, res) => {
  const data = await HackathonService.getOrganizerAnalytics(req.params.id, req.user._id);
  res.json({ success: true, data });
});
