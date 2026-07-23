import { asyncHandler } from '../middlewares/asyncHandler.js';
import HackathonService from '../services/HackathonService.js';
import HackathonRegistrationService from '../services/HackathonRegistrationService.js';
import HackathonTeamService from '../services/HackathonTeamService.js';
import HackathonSubmissionService from '../services/HackathonSubmissionService.js';
import HackathonAiService from '../services/HackathonAiService.js';
import HackathonAnalyticsService from '../services/HackathonAnalyticsService.js';
import PaymentService from '../services/PaymentService.js';

export const listHackathons = asyncHandler(async (req, res) => {
  const data = await HackathonService.listHackathons(req.query);
  res.json({ success: true, ...data });
});

export const getHackathon = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.getBySlug(req.params.slug);
  res.json({ success: true, hackathon });
});

export const createHackathon = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.create(req.user._id, req.body);
  res.status(201).json({ success: true, hackathon });
});

export const updateHackathon = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.update(
    req.params.id, req.user._id, { ...req.body, _hackathon: req.hackathon }
  );
  res.json({ success: true, hackathon });
});

export const deleteHackathon = asyncHandler(async (req, res) => {
  await HackathonService.softDelete(req.hackathon);
  res.json({ success: true, message: 'Hackathon cancelled successfully' });
});

export const registerIndividual = asyncHandler(async (req, res) => {
  const registration = await HackathonRegistrationService.registerIndividual(
    req.params.id, req.user._id, req.app.get('io'),
  );
  res.status(201).json({ success: true, registration });
});

export const cancelRegistration = asyncHandler(async (req, res) => {
  const reg = await HackathonRegistrationService.cancelRegistration(
    req.params.registrationId, req.user._id,
  );
  res.json({ success: true, registration: reg });
});

export const createTeam = asyncHandler(async (req, res) => {
  const team = await HackathonTeamService.createTeam(
    req.params.id, req.user._id, req.body,
  );
  res.status(201).json({ success: true, team });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.getBySlug(req.hackathon?.slug) || req.hackathon;
  const team = await HackathonTeamService.inviteMember(
    req.team,
    hackathon,
    req.user._id,
    req.body.userId,
    req.app.get('io'),
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
  const result = await HackathonTeamService.leaveTeam(req.params.teamId, req.user._id);
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

export const upsertSubmission = asyncHandler(async (req, res) => {
  const submission = await HackathonSubmissionService.upsertSubmission(
    req.params.id, req.params.teamId, req.user._id, req.body, req.app.get('io'),
  );
  res.json({ success: true, submission });
});

export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await HackathonSubmissionService.getSubmission(
    req.params.id, req.params.teamId,
  );
  res.json({ success: true, submission });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await HackathonSubmissionService.getLeaderboard(req.params.id);
  res.json({ success: true, leaderboard });
});

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const result = await PaymentService.createHackathonOrder(req.body.registrationId, req.user._id);
  res.json({ success: true, ...result });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const result = await PaymentService.verifyHackathonPayment(req.body);
  res.json({ success: true, ...result });
});

export const getAiTeamSuggestions = asyncHandler(async (req, res) => {
  const data = await HackathonAiService.getTeamSuggestions(req.params.id, req.user._id);
  res.json({ success: true, data });
});

export const getSkillGapAnalysis = asyncHandler(async (req, res) => {
  const data = await HackathonAiService.getSkillGapAnalysis(req.params.id, req.params.teamId);
  res.json({ success: true, data });
});

export const getProjectIdeas = asyncHandler(async (req, res) => {
  const data = await HackathonAiService.getProjectIdeas(req.params.id, req.body.teamSkills || []);
  res.json({ success: true, data });
});

export const getTeamBalanceAnalysis = asyncHandler(async (req, res) => {
  const data = await HackathonAiService.getTeamBalanceAnalysis(req.params.id, req.params.teamId);
  res.json({ success: true, data });
});

export const getSubmissionChecklist = asyncHandler(async (req, res) => {
  const data = await HackathonAiService.getSubmissionChecklist(req.params.id);
  res.json({ success: true, data });
});

export const getOrganizerDashboard = asyncHandler(async (req, res) => {
  const data = await HackathonAnalyticsService.getOrganizerDashboard(req.params.id, req.user._id);
  res.json({ success: true, data });
});

export { createTeammateRequest, getTeammateRequests, expressInterest } from './teammateRequestController.js';

