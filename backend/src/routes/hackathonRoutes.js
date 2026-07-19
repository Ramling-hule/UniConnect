import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  requireOrganizer,
  requireHackathonOwner,
  requireTeamCaptain,
} from '../middlewares/hackathonGuards.js';
import {
  listHackathons, getHackathon,
  createHackathon, updateHackathon, deleteHackathon,
  registerIndividual, cancelRegistration,
  createTeam, inviteMember, acceptInvite, rejectInvite,
  leaveTeam, transferCaptain, discoverTeams,
  upsertSubmission, getSubmission, getLeaderboard,
  createPaymentOrder, verifyPayment,
  getAiTeamSuggestions, getSkillGapAnalysis, getProjectIdeas,
  getTeamBalanceAnalysis, getSubmissionChecklist,
  getOrganizerDashboard,
} from '../controllers/hackathonController.js';

const router = express.Router();

/**
 * Hackathon Routes
 *
 * SOLID applied:
 *  - SRP: Guards are composable middleware with one rule each.
 *  - Chain of Responsibility: protect → requireOrganizer → controller
 *    Each middleware in the chain has one job and passes to the next.
 *
 * Pattern: Chain of Responsibility (Express middleware chain)
 */

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
router.get('/',                listHackathons);
router.get('/:slug',           getHackathon);
router.get('/:id/leaderboard', getLeaderboard);

// ─── PROTECTED — all routes below require authentication ──────────────────────
router.use(protect);

// Organizer CRUD — Guard applied at route level (not controller)
router.post('/',           requireOrganizer,                     createHackathon);
router.patch('/:id',       requireHackathonOwner,               updateHackathon);
router.delete('/:id',      requireHackathonOwner,               deleteHackathon);

// Registration
router.post('/:id/register',                    registerIndividual);
router.delete('/registrations/:registrationId', cancelRegistration);

// Teams
router.post('/:id/teams',                             createTeam);
router.get('/:id/teams/discover',                     discoverTeams);
router.post('/:id/teams/:teamId/invite',  requireTeamCaptain, inviteMember);
router.post('/:id/teams/:teamId/accept',              acceptInvite);
router.post('/:id/teams/:teamId/reject',              rejectInvite);
router.post('/:id/teams/:teamId/leave',               leaveTeam);
router.patch('/:id/teams/:teamId/captain',            transferCaptain);

// Submissions
router.post('/:id/teams/:teamId/submission',  upsertSubmission);
router.get('/:id/teams/:teamId/submission',   getSubmission);

// Payment
router.post('/payment/create',  createPaymentOrder);
router.post('/payment/verify',  verifyPayment);

// AI — all AI routes protected
router.get('/:id/ai/team-suggestions',              getAiTeamSuggestions);
router.get('/:id/ai/submission-checklist',          getSubmissionChecklist);
router.get('/:id/teams/:teamId/ai/skill-gap',       getSkillGapAnalysis);
router.get('/:id/teams/:teamId/ai/team-balance',    getTeamBalanceAnalysis);
router.post('/:id/ai/project-ideas',                getProjectIdeas);

// Organizer Dashboard
router.get('/:id/dashboard', getOrganizerDashboard);

export default router;
