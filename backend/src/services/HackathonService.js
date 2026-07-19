import slugify from '../utils/slugify.js';
import AppError from '../utils/AppError.js';
import Hackathon from '../models/Hackathon.js';
import HackathonRegistration from '../models/HackathonRegistration.js';
import HackathonTeam from '../models/HackathonTeam.js';
import HackathonSubmission from '../models/HackathonSubmission.js';
import CacheService from './CacheService.js';
import notificationManager from './notificationService.js';
import AiService from './AiService.js';

const HACKATHON_CACHE_TTL = 300; // 5 minutes

/**
 * HackathonService — Core business logic for the Hackathon Platform.
 *
 * Design patterns applied:
 *  - SRP: All hackathon domain logic here; controllers are thin HTTP adapters.
 *  - DIP: Depends on CacheService, AiService, notificationManager abstractions.
 *  - Reuses: CacheService, AiService, notificationManager — never re-implements them.
 */
class HackathonService {

  // ─── DISCOVERY ─────────────────────────────────────────────────────────────

  async listHackathons({ page = 1, limit = 20, category, skills, mode, difficulty,
    isFree, minPrize, registrationOpen, search, sort = 'createdAt' } = {}) {

    const cacheKey = `hackathons:list:${JSON.stringify(arguments[0])}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const query = {
      status: { $in: ['published', 'ongoing'] },
      visibility: 'public',
      deletedAt: null,
    };

    if (category)     query.category = { $regex: category, $options: 'i' };
    if (mode)         query.mode = mode;
    if (difficulty)   query.difficulty = difficulty;
    if (isFree !== undefined) query.isFree = isFree === 'true';
    if (skills) {
      const skillsArr = Array.isArray(skills) ? skills : [skills];
      query.skills = { $in: skillsArr };
    }
    if (registrationOpen === 'true') {
      const now = new Date();
      query['timeline.registrationOpen'] = { $lte: now };
      query['timeline.registrationClose'] = { $gte: now };
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap = {
      createdAt: { createdAt: -1 },
      prizePool:  { 'prizes.0.amount': -1 },
      deadline:   { 'timeline.registrationClose': 1 },
      popular:    { registrationCount: -1 },
    };

    const skip = (page - 1) * limit;
    const [hackathons, total] = await Promise.all([
      Hackathon.find(query)
        .sort(sortMap[sort] || { createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select('-faqs -rules -judgingCriteria -resources')
        .lean(),
      Hackathon.countDocuments(query),
    ]);

    const result = { hackathons, total, page: Number(page), pages: Math.ceil(total / limit) };
    await CacheService.set(cacheKey, result, HACKATHON_CACHE_TTL);
    return result;
  }

  async getBySlug(slug) {
    const cacheKey = `hackathon:slug:${slug}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const hackathon = await Hackathon.findOne({ slug, deletedAt: null })
      .populate('organizer', 'name profilePicture headline institute')
      .lean();
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    await CacheService.set(cacheKey, hackathon, HACKATHON_CACHE_TTL);
    return hackathon;
  }

  // ─── ORGANIZER CRUD ────────────────────────────────────────────────────────

  async create(organizerId, data) {
    const slug = slugify(data.title);
    const exists = await Hackathon.findOne({ slug });
    const finalSlug = exists ? `${slug}-${Date.now()}` : slug;

    const hackathon = await Hackathon.create({
      ...data,
      slug: finalSlug,
      organizer: organizerId,
      status: data.status || 'draft',
    });

    await CacheService.del('hackathons:list:*');
    return hackathon;
  }

  async update(hackathonId, organizerId, data) {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);
    if (hackathon.organizer.toString() !== organizerId.toString()) {
      throw new AppError('Not authorized to edit this hackathon', 403);
    }

    // Prevent modifying completed/cancelled hackathons
    if (['completed', 'cancelled'].includes(hackathon.status)) {
      throw new AppError('Cannot modify a completed or cancelled hackathon', 400);
    }

    Object.assign(hackathon, data);
    await hackathon.save();
    await CacheService.del(`hackathon:slug:${hackathon.slug}`);
    return hackathon;
  }

  async softDelete(hackathonId, organizerId) {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);
    if (hackathon.organizer.toString() !== organizerId.toString()) {
      throw new AppError('Not authorized', 403);
    }
    hackathon.deletedAt = new Date();
    hackathon.status = 'cancelled';
    await hackathon.save();
    await CacheService.del(`hackathon:slug:${hackathon.slug}`);
  }

  // ─── REGISTRATION ──────────────────────────────────────────────────────────

  async registerIndividual(hackathonId, userId, io) {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    const now = new Date();
    if (now > hackathon.timeline.registrationClose) {
      throw new AppError('Registration deadline has passed', 400);
    }
    if (now < hackathon.timeline.registrationOpen) {
      throw new AppError('Registration has not opened yet', 400);
    }

    const existing = await HackathonRegistration.findOne({ hackathon: hackathonId, user: userId });
    if (existing) throw new AppError('Already registered for this hackathon', 409);

    // Distributed lock to prevent race conditions at scale
    const lockKey = `hackathon_reg_lock:${hackathonId}:${userId}`;
    const lockId = `${Date.now()}`;
    const acquired = await CacheService.acquireLock(lockKey, lockId, 10);
    if (!acquired) throw new AppError('Registration in progress, please try again', 429);

    try {
      let status = 'confirmed';
      let waitlistPosition = null;

      if (hackathon.maxParticipants && hackathon.registrationCount >= hackathon.maxParticipants) {
        if (!hackathon.waitlistEnabled) throw new AppError('Hackathon is full', 409);
        const waitlistCount = await HackathonRegistration.countDocuments({
          hackathon: hackathonId, status: 'waitlisted',
        });
        status = 'waitlisted';
        waitlistPosition = waitlistCount + 1;
      }

      if (hackathon.approvalRequired) status = 'pending';
      if (!hackathon.isFree) status = 'pending'; // payment required before confirmation

      const registration = await HackathonRegistration.create({
        hackathon: hackathonId,
        user: userId,
        registrationType: 'individual',
        status,
        waitlistPosition,
        paymentStatus: hackathon.isFree ? 'not_required' : 'pending',
      });

      if (status === 'confirmed') {
        await Hackathon.findByIdAndUpdate(hackathonId, { $inc: { registrationCount: 1 } });
      }

      // Fire notification
      await notificationManager.notify({
        recipientId: userId,
        type: 'hackathon_accepted',
        message: `You have successfully registered for "${hackathon.title}"`,
        link: `/hackathons/${hackathon.slug}`,
        relatedId: hackathon._id,
      }, io);

      return registration;
    } finally {
      await CacheService.releaseLock(lockKey);
    }
  }

  async cancelRegistration(registrationId, userId) {
    const reg = await HackathonRegistration.findById(registrationId).populate('hackathon');
    if (!reg) throw new AppError('Registration not found', 404);
    if (reg.user.toString() !== userId.toString()) throw new AppError('Not authorized', 403);
    if (reg.status === 'cancelled') throw new AppError('Already cancelled', 400);

    reg.status = 'cancelled';
    await reg.save();

    if (reg.status === 'confirmed') {
      await Hackathon.findByIdAndUpdate(reg.hackathon._id, { $inc: { registrationCount: -1 } });
      // Promote first waitlisted user
      const nextWaitlisted = await HackathonRegistration.findOne({
        hackathon: reg.hackathon._id, status: 'waitlisted',
      }).sort({ waitlistPosition: 1 });
      if (nextWaitlisted) {
        nextWaitlisted.status = 'confirmed';
        nextWaitlisted.waitlistPosition = null;
        await nextWaitlisted.save();
        await Hackathon.findByIdAndUpdate(reg.hackathon._id, { $inc: { registrationCount: 1 } });
      }
    }
    return reg;
  }

  // ─── AI FEATURES ───────────────────────────────────────────────────────────

  async getAiTeamSuggestions(hackathonId, userId) {
    const cacheKey = `ai:team_suggestions:${hackathonId}:${userId}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const hackathon = await Hackathon.findById(hackathonId).lean();
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    const prompt = `You are an AI system that matches hackathon participants.
Hackathon: "${hackathon.title}"
Tracks: ${hackathon.tracks.map(t => t.name).join(', ')}
Required skills: ${hackathon.skills.join(', ')}

Generate 5 ideal complementary team member profiles (not real users) that would form a balanced team.
For each profile, specify: role, top 3 skills, and why they complement the team.
Return as JSON array: [{ role, skills, reason }]`;

    const result = await AiService.generateContent({
      contents: prompt,
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(result);
    await CacheService.set(cacheKey, parsed, 600); // 10 min cache
    return parsed;
  }

  async getSkillGapAnalysis(hackathonId, teamId) {
    const [hackathon, team] = await Promise.all([
      Hackathon.findById(hackathonId).lean(),
      HackathonTeam.findById(teamId).populate('members.user', 'skills headline').lean(),
    ]);
    if (!hackathon) throw new AppError('Hackathon not found', 404);
    if (!team)      throw new AppError('Team not found', 404);

    const teamSkills = team.members.flatMap(m => m.user?.skills || []);
    const requiredSkills = hackathon.skills;

    const prompt = `Analyze this hackathon team's skill coverage.
Required skills for "${hackathon.title}": ${requiredSkills.join(', ')}
Team's combined skills: ${[...new Set(teamSkills)].join(', ')}

Identify skill gaps and recommend what roles/skills the team should look for.
Return as JSON: { gaps: [string], recommendations: [string], coverageScore: number (0-100) }`;

    return JSON.parse(await AiService.generateContent({
      contents: prompt,
      responseMimeType: 'application/json',
    }));
  }

  async getProjectIdeaSuggestions(hackathonId, teamSkills) {
    const hackathon = await Hackathon.findById(hackathonId).lean();
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    const prompt = `Generate 3 innovative project ideas for the hackathon "${hackathon.title}".
Hackathon tracks: ${hackathon.tracks.map(t => t.name).join(', ')}
Team skills: ${teamSkills.join(', ')}

For each idea include: title, problem, solution, tech stack, 30-day sprint outline.
Return as JSON array.`;

    return JSON.parse(await AiService.generateContent({
      contents: prompt,
      responseMimeType: 'application/json',
    }));
  }

  // ─── ORGANIZER DASHBOARD ───────────────────────────────────────────────────

  async getOrganizerAnalytics(hackathonId, organizerId) {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);
    if (hackathon.organizer.toString() !== organizerId.toString()) {
      throw new AppError('Not authorized', 403);
    }

    const [registrationStats, submissionStats, teamStats] = await Promise.all([
      HackathonRegistration.aggregate([
        { $match: { hackathon: hackathon._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      HackathonSubmission.aggregate([
        { $match: { hackathon: hackathon._id } },
        { $group: { _id: '$isDraft', count: { $sum: 1 } } },
      ]),
      HackathonTeam.countDocuments({ hackathon: hackathonId }),
    ]);

    const regByStatus = registrationStats.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {});

    return {
      hackathon: { title: hackathon.title, slug: hackathon.slug, status: hackathon.status },
      registrations: {
        total: hackathon.registrationCount,
        confirmed:  regByStatus.confirmed  || 0,
        pending:    regByStatus.pending    || 0,
        waitlisted: regByStatus.waitlisted || 0,
        cancelled:  regByStatus.cancelled  || 0,
      },
      teams: { total: teamStats },
      submissions: {
        drafts:   submissionStats.find(s => s._id === true)?.count  || 0,
        final:    submissionStats.find(s => s._id === false)?.count || 0,
      },
    };
  }
}

export default new HackathonService();
