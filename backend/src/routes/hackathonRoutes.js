import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  listHackathons, getHackathon,
  createHackathon, updateHackathon, deleteHackathon,
  registerIndividual, cancelRegistration,
  createTeam, inviteMember, acceptInvite, rejectInvite,
  leaveTeam, transferCaptain, discoverTeams,
  upsertSubmission, getSubmission, getLeaderboard,
  createPaymentOrder, verifyPayment,
  getAiTeamSuggestions, getSkillGapAnalysis, getProjectIdeas,
  getOrganizerDashboard,
} from '../controllers/hackathonController.js';

const router = express.Router();

// ─── PUBLIC ───────────────────────────────────────────────────────────────────
router.get('/',            listHackathons);   // GET /api/hackathons
router.get('/:slug',       getHackathon);     // GET /api/hackathons/:slug
router.get('/:id/leaderboard', getLeaderboard);

// ─── PROTECTED ────────────────────────────────────────────────────────────────
router.use(protect); // All routes below require authentication

// Organizer CRUD
router.post('/',           createHackathon);
router.patch('/:id',       updateHackathon);
router.delete('/:id',      deleteHackathon);

// Registration
router.post('/:id/register',                  registerIndividual);
router.delete('/registrations/:registrationId', cancelRegistration);

// Teams
router.post('/:id/teams',                          createTeam);
router.get('/:id/teams/discover',                  discoverTeams);
router.post('/:id/teams/:teamId/invite',           inviteMember);
router.post('/:id/teams/:teamId/accept',           acceptInvite);
router.post('/:id/teams/:teamId/reject',           rejectInvite);
router.post('/:id/teams/:teamId/leave',            leaveTeam);
router.patch('/:id/teams/:teamId/captain',         transferCaptain);

// Submissions
router.post('/:id/teams/:teamId/submission',       upsertSubmission);
router.get('/:id/teams/:teamId/submission',        getSubmission);

// Payment
router.post('/payment/create',                     createPaymentOrder);
router.post('/payment/verify',                     verifyPayment);

// AI Features
router.get('/:id/ai/team-suggestions',             getAiTeamSuggestions);
router.get('/:id/teams/:teamId/ai/skill-gap',      getSkillGapAnalysis);
router.post('/:id/ai/project-ideas',               getProjectIdeas);

// Organizer Dashboard
router.get('/:id/dashboard',                       getOrganizerDashboard);

export default router;
