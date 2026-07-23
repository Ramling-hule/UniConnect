import AppError from '../utils/AppError.js';
import HackathonSubmission from '../models/HackathonSubmission.js';
import HackathonTeam from '../models/HackathonTeam.js';
import Hackathon from '../models/Hackathon.js';
import notificationManager from './notificationService.js';
class HackathonSubmissionService {

  async _assertTeamMembership(teamId, userId) {
    const team = await HackathonTeam.findById(teamId);
    if (!team) throw new AppError('Team not found', 404);
    const isMember = team.members.some(m => m.user.toString() === userId.toString());
    if (!isMember) throw new AppError('You are not a member of this team', 403);
    return team;
  }

  async _assertDeadlineNotPassed(hackathon) {
    if (hackathon.timeline.hackathonEnd < new Date()) {
      throw new AppError('Submission deadline has passed', 400);
    }
  }

  async upsertSubmission(hackathonId, teamId, userId, data, io) {
    const [hackathon, team] = await Promise.all([
      Hackathon.findById(hackathonId),
      this._assertTeamMembership(teamId, userId),
    ]);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    let submission = await HackathonSubmission.findOne({ hackathon: hackathonId, team: teamId });

    if (submission?.isLocked) {
      throw new AppError('Submission is locked — deadline has passed', 400);
    }

    const versionEntry = { ...data, submittedBy: userId, isDraft: data.isDraft ?? true };

    if (!submission) {
      submission = await HackathonSubmission.create({
        hackathon: hackathonId,
        team: teamId,
        ...data,
        isDraft: data.isDraft ?? true,
        history: [versionEntry],
      });
    } else {
      Object.assign(submission, data);
      submission.isDraft = data.isDraft ?? submission.isDraft;
      submission.history.push(versionEntry);
      await submission.save();
    }
    if (!submission.isDraft) {
      submission.finalSubmittedAt = new Date();
      submission.finalSubmittedBy = userId;
      await submission.save();
      await notificationManager.notify({
        recipientId: hackathon.organizer,
        senderId: userId,
        type: 'hackathon_submission',
        message: `Team "${team.name}" submitted for "${hackathon.title}"`,
        link: `/hackathons/${hackathon.slug}/dashboard`,
        relatedId: submission._id,
      }, io);
    }

    return submission;
  }

  async getSubmission(hackathonId, teamId) {
    return HackathonSubmission.findOne({ hackathon: hackathonId, team: teamId })
      .populate('finalSubmittedBy', 'name profilePicture')
      .lean();
  }

  async getLeaderboard(hackathonId) {
    return HackathonSubmission.find({ hackathon: hackathonId, isDraft: false })
      .sort({ totalScore: -1 })
      .populate('team', 'name captain members')
      .select('team totalScore rank isWinner prizeWon')
      .limit(100)
      .lean();
  }

  async lockAllSubmissions(hackathonId) {
    await HackathonSubmission.updateMany(
      { hackathon: hackathonId },
      { $set: { isLocked: true } },
    );
  }
}

export default new HackathonSubmissionService();
