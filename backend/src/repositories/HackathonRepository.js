import Hackathon from '../models/Hackathon.js';
class HackathonRepository {

  async findById(id) {
    return Hackathon.findById(id);
  }

  async findByIdLean(id) {
    return Hackathon.findById(id).lean();
  }

  async findBySlug(slug) {
    return Hackathon.findOne({ slug, deletedAt: null })
      .populate('organizer', 'name profilePicture headline institute')
      .lean();
  }

  async findBySlugExists(slug) {
    return Hackathon.findOne({ slug });
  }

  async create(data) {
    return Hackathon.create(data);
  }

  async save(hackathon) {
    return hackathon.save();
  }

  async updateById(id, update, options = {}) {
    return Hackathon.findByIdAndUpdate(id, update, options);
  }
  async findMany(filter, { sort, skip, limit, select } = {}) {
    let q = Hackathon.find(filter);
    if (sort)   q = q.sort(sort);
    if (skip)   q = q.skip(skip);
    if (limit)  q = q.limit(Number(limit));
    if (select) q = q.select(select);
    return q.lean();
  }

  async count(filter) {
    return Hackathon.countDocuments(filter);
  }

  async incrementCount(hackathonId, field, delta = 1) {
    return Hackathon.findByIdAndUpdate(hackathonId, { $inc: { [field]: delta } });
  }
}

export default new HackathonRepository();
