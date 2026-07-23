import AppError from '../utils/AppError.js';
import HackathonRepository from '../repositories/HackathonRepository.js';
import HackathonRegistrationRepository from '../repositories/HackathonRegistrationRepository.js';
import HackathonTeam from '../models/HackathonTeam.js';
import HackathonSubmission from '../models/HackathonSubmission.js';
class HackathonAnalyticsService {

  async getOrganizerDashboard(hackathonId, organizerId) {
    const hackathon = await HackathonRepository.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    if (hackathon.organizer.toString() !== organizerId.toString()) {
      throw new AppError('Not authorized', 403);
    }

    const [registrationStats, submissionStats, teamCount] = await Promise.all([
      this._registrationsByStatus(hackathon._id),
      this._submissionsByDraftStatus(hackathon._id),
      HackathonTeam.countDocuments({ hackathon: hackathonId }),
    ]);

    const regByStatus = registrationStats.reduce(
      (acc, r) => ({ ...acc, [r._id]: r.count }), {}
    );

    return {
      hackathon: { title: hackathon.title, slug: hackathon.slug, status: hackathon.status },
      registrations: {
        total:      hackathon.registrationCount,
        confirmed:  regByStatus.confirmed  || 0,
        pending:    regByStatus.pending    || 0,
        waitlisted: regByStatus.waitlisted || 0,
        cancelled:  regByStatus.cancelled  || 0,
      },
      teams: { total: teamCount },
      submissions: {
        drafts: submissionStats.find(s => s._id === true)?.count  || 0,
        final:  submissionStats.find(s => s._id === false)?.count || 0,
      },
    };
  }

  async _registrationsByStatus(hackathonObjectId) {
    return HackathonRegistrationRepository.aggregateByStatus(hackathonObjectId);
  }

  async _submissionsByDraftStatus(hackathonObjectId) {
    return HackathonSubmission.aggregate([
      { $match: { hackathon: hackathonObjectId } },
      { $group: { _id: '$isDraft', count: { $sum: 1 } } },
    ]);
  }
}

export default new HackathonAnalyticsService();
