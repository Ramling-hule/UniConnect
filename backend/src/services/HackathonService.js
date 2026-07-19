import slugify from '../utils/slugify.js';
import AppError from '../utils/AppError.js';
import CacheService from './CacheService.js';
import CacheKeys from '../utils/CacheKeys.js';
import HackathonRepository from '../repositories/HackathonRepository.js';
import HackathonQueryBuilder from '../strategies/HackathonFilterStrategy.js';

/**
 * HackathonService — Discovery & CRUD for the Hackathon entity.
 *
 * SOLID applied (refactored):
 *  - SRP: This class now has ONE responsibility — Hackathon CRUD and discovery.
 *         Registration, AI, and Analytics are extracted to dedicated services.
 *  - DIP: Depends on HackathonRepository (not Mongoose), CacheService, CacheKeys.
 *  - OCP: Query building is delegated to HackathonQueryBuilder (Strategy pattern).
 *         New filters never require touching this class.
 *
 * Design Patterns applied:
 *  - Repository Pattern: All DB access via HackathonRepository
 *  - Strategy Pattern:   Filter building via HackathonQueryBuilder
 *  - Facade:             CacheService abstracts Redis
 */
class HackathonService {

  // ─── DISCOVERY ─────────────────────────────────────────────────────────────

  async listHackathons(params = {}) {
    const { page = 1, limit = 20, sort = 'createdAt' } = params;

    const cacheKey = CacheKeys.hackathonList(params);
    const cached   = await CacheService.get(cacheKey);
    if (cached) return cached;

    // Strategy Pattern: filter logic is not this service's concern
    const filter = HackathonQueryBuilder.build(params);
    const sortDoc = HackathonQueryBuilder.buildSort(sort);
    const skip = (page - 1) * limit;

    const [hackathons, total] = await Promise.all([
      HackathonRepository.findMany(filter, {
        sort: sortDoc, skip, limit,
        select: '-faqs -rules -judgingCriteria -resources',
      }),
      HackathonRepository.count(filter),
    ]);

    const result = { hackathons, total, page: Number(page), pages: Math.ceil(total / limit) };
    await CacheService.set(cacheKey, result, 300);
    return result;
  }

  async getBySlug(slug) {
    const cacheKey = CacheKeys.hackathonBySlug(slug);
    const cached   = await CacheService.get(cacheKey);
    if (cached) return cached;

    const hackathon = await HackathonRepository.findBySlug(slug);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    await CacheService.set(cacheKey, hackathon, 300);
    return hackathon;
  }

  // ─── ORGANIZER CRUD ────────────────────────────────────────────────────────

  async create(organizerId, data) {
    const slug      = slugify(data.title);
    const exists    = await HackathonRepository.findBySlugExists(slug);
    const finalSlug = exists ? `${slug}-${Date.now()}` : slug;

    const hackathon = await HackathonRepository.create({
      ...data,
      slug: finalSlug,
      organizer: organizerId,
      status: data.status || 'draft',
    });

    await CacheService.del(CacheKeys.hackathonListAll());
    return hackathon;
  }

  async update(hackathonId, organizerId, data) {
    // Use pre-fetched hackathon if guard attached it to avoid N+1
    const hackathon = data._hackathon || await HackathonRepository.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    if (['completed', 'cancelled'].includes(hackathon.status)) {
      throw new AppError('Cannot modify a completed or cancelled hackathon', 400);
    }

    const { _hackathon, ...safeData } = data;
    Object.assign(hackathon, safeData);
    await HackathonRepository.save(hackathon);
    await CacheService.del(CacheKeys.hackathonBySlug(hackathon.slug));
    return hackathon;
  }

  async softDelete(hackathon) {
    hackathon.deletedAt = new Date();
    hackathon.status    = 'cancelled';
    await HackathonRepository.save(hackathon);
    await CacheService.del(CacheKeys.hackathonBySlug(hackathon.slug));
  }
}

export default new HackathonService();
