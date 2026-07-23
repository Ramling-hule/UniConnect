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
  createTeammateRequest,
  getTeammateRequests,
  expressInterest,
  getOrganizerDashboard,
} from '../controllers/hackathonController.js';

const router = express.Router();
router.get('/',                listHackathons);
router.get('/:slug',           getHackathon);
router.get('/:id/leaderboard', getLeaderboard);
router.use(protect);
router.post('/',           requireOrganizer,                     createHackathon);
router.patch('/:id',       requireHackathonOwner,               updateHackathon);
router.delete('/:id',      requireHackathonOwner,               deleteHackathon);
router.post('/:id/register',                    registerIndividual);
router.delete('/registrations/:registrationId', cancelRegistration);
router.post('/:id/teams',                             createTeam);
router.get('/:id/teams/discover',                     discoverTeams);
router.post('/:id/teammate-requests',                 createTeammateRequest);
router.get('/:id/teammate-requests',                  getTeammateRequests);
router.post('/teammate-requests/:id/interest',        expressInterest);
router.post('/:id/teams/:teamId/invite',  requireTeamCaptain, inviteMember);
router.post('/:id/teams/:teamId/accept',              acceptInvite);
router.post('/:id/teams/:teamId/reject',              rejectInvite);
router.post('/:id/teams/:teamId/leave',               leaveTeam);
router.patch('/:id/teams/:teamId/captain',            transferCaptain);
router.post('/:id/teams/:teamId/submission',  upsertSubmission);
router.get('/:id/teams/:teamId/submission',   getSubmission);
router.post('/payment/create',  createPaymentOrder);
router.post('/payment/verify',  verifyPayment);
router.get('/:id/ai/team-suggestions',              getAiTeamSuggestions);
router.get('/:id/ai/submission-checklist',          getSubmissionChecklist);
router.get('/:id/teams/:teamId/ai/skill-gap',       getSkillGapAnalysis);
router.get('/:id/teams/:teamId/ai/team-balance',    getTeamBalanceAnalysis);
router.post('/:id/ai/project-ideas',                getProjectIdeas);
router.get('/:id/dashboard', getOrganizerDashboard);

export default router;
