import HackathonRegistration from '../models/HackathonRegistration.js';
class HackathonRegistrationRepository {

  async findByHackathonAndUser(hackathonId, userId) {
    return HackathonRegistration.findOne({ hackathon: hackathonId, user: userId });
  }

  async findById(id) {
    return HackathonRegistration.findById(id).populate('hackathon');
  }

  async create(data) {
    return HackathonRegistration.create(data);
  }

  async save(registration) {
    return registration.save();
  }

  async countByStatus(hackathonId, status) {
    return HackathonRegistration.countDocuments({ hackathon: hackathonId, status });
  }

  async findFirstWaitlisted(hackathonId) {
    return HackathonRegistration.findOne({
      hackathon: hackathonId,
      status: 'waitlisted',
    }).sort({ waitlistPosition: 1 });
  }

  async aggregateByStatus(hackathonId) {
    return HackathonRegistration.aggregate([
      { $match: { hackathon: hackathonId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }
}

export default new HackathonRegistrationRepository();
