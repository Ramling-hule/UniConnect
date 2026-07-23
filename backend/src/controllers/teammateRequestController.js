import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import TeammateRequest from '../models/TeammateRequest.js';
import InterestRequest from '../models/InterestRequest.js';
import HackathonTeam from '../models/HackathonTeam.js';
import Notification from '../models/Notification.js';

export const createTeammateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, requiredSkills, preferredYear, preferredBranch, preferredCodingExperience, requiredTechnologies, seatsAvailable } = req.body;

  const team = await HackathonTeam.findOne({ hackathon: id, 'members.user': req.user._id });

  const request = await TeammateRequest.create({
    hackathon: id,
    team: team ? team._id : null,
    creator: req.user._id,
    description,
    requiredSkills,
    preferredYear,
    preferredBranch,
    preferredCodingExperience,
    requiredTechnologies,
    seatsAvailable,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.status(201).json({ success: true, request });
});

export const getTeammateRequests = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { skills, branch, year } = req.query;

  let query = { hackathon: id, status: 'active' };

  if (skills) query.requiredSkills = { $in: skills.split(',') };
  if (branch) query.preferredBranch = branch;
  if (year) query.preferredYear = year;

  const requests = await TeammateRequest.find(query)
    .populate('creator', 'name username profilePicture headline skills')
    .populate('team', 'name description maxMembers')
    .sort('-createdAt');

  res.json({ success: true, requests });
});

export const expressInterest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const teammateRequest = await TeammateRequest.findById(id).populate('creator');
  if (!teammateRequest) throw new AppError('Request not found', 404);

  const existingTeam = await HackathonTeam.findOne({ hackathon: teammateRequest.hackathon, 'members.user': req.user._id });
  if (existingTeam) throw new AppError('You are already in a team for this hackathon', 400);

  const existingInterest = await InterestRequest.findOne({ teammateRequest: id, user: req.user._id });
  if (existingInterest) throw new AppError('Already expressed interest', 400);

  const interest = await InterestRequest.create({
    teammateRequest: id,
    hackathon: teammateRequest.hackathon,
    team: teammateRequest.team,
    user: req.user._id,
    message: req.body.message || ''
  });

  await Notification.create({
    recipient: teammateRequest.creator._id,
    sender: req.user._id,
    type: 'INTEREST_RECEIVED',
    message: 'is interested in joining your team',
    link: `/hackathons/${teammateRequest.hackathon}/team`,
    relatedId: teammateRequest.hackathon
  });

  if (req.app.get('io')) {
    req.app.get('io').to(teammateRequest.creator._id.toString()).emit('new_notification', { type: 'INTEREST_RECEIVED' });
  }

  res.status(201).json({ success: true, interest });
});
