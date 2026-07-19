/**
 * HackathonFilterStrategy — Strategy Pattern for query building.
 *
 * SOLID applied:
 *  - OCP: Each filter is a self-contained class. Adding a new filter (e.g., PrizeFilter)
 *         means creating a new class and registering it — existing code is never modified.
 *  - SRP: Each strategy has one job: decide if it applies, and apply itself.
 *  - DIP: HackathonService depends on this abstraction, not on raw if-chains.
 *
 * Design Pattern: Strategy Pattern
 *  Eliminates the open/closed violation in listHackathons where every new filter
 *  required modifying the service method.
 */

// ─── Base Contract ────────────────────────────────────────────────────────────

class FilterStrategy {
  /**
   * @param {Object} params - Raw query params from req.query
   * @returns {boolean} Whether this filter should be applied
   */
  applies(params) { return false; }

  /**
   * @param {Object} query  - The MongoDB query object to mutate
   * @param {Object} params - Raw query params
   */
  apply(query, params) {}
}

// ─── Concrete Strategies ──────────────────────────────────────────────────────

class CategoryFilter extends FilterStrategy {
  applies({ category }) { return Boolean(category); }
  apply(query, { category }) {
    query.category = { $regex: category, $options: 'i' };
  }
}

class ModeFilter extends FilterStrategy {
  applies({ mode }) { return Boolean(mode); }
  apply(query, { mode }) { query.mode = mode; }
}

class DifficultyFilter extends FilterStrategy {
  applies({ difficulty }) { return Boolean(difficulty); }
  apply(query, { difficulty }) { query.difficulty = difficulty; }
}

class FreeFilter extends FilterStrategy {
  applies({ isFree }) { return isFree !== undefined; }
  apply(query, { isFree }) { query.isFree = isFree === 'true'; }
}

class SkillsFilter extends FilterStrategy {
  applies({ skills }) { return Boolean(skills); }
  apply(query, { skills }) {
    const skillsArr = Array.isArray(skills) ? skills : [skills];
    query.skills = { $in: skillsArr };
  }
}

class RegistrationOpenFilter extends FilterStrategy {
  applies({ registrationOpen }) { return registrationOpen === 'true'; }
  apply(query) {
    const now = new Date();
    query['timeline.registrationOpen']  = { $lte: now };
    query['timeline.registrationClose'] = { $gte: now };
  }
}

class SearchFilter extends FilterStrategy {
  applies({ search }) { return Boolean(search); }
  apply(query, { search }) {
    query.$or = [
      { title:       { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category:    { $regex: search, $options: 'i' } },
    ];
  }
}

class PrizePoolFilter extends FilterStrategy {
  applies({ minPrize }) { return Boolean(minPrize); }
  apply(query, { minPrize }) {
    query['prizes.0.amount'] = { $gte: Number(minPrize) };
  }
}

// ─── Filter Builder (Facade) ──────────────────────────────────────────────────

/**
 * HackathonQueryBuilder — Facade over all registered filter strategies.
 *
 * Design Pattern: Facade + Strategy
 *  Callers call one method. Internally it asks each registered strategy
 *  whether it applies, and applies it if so.
 *
 * OCP: New filters are added by instantiating a new strategy class and
 *      pushing it to the `strategies` array. Zero changes to callers.
 */
class HackathonQueryBuilder {
  constructor() {
    this.strategies = [
      new CategoryFilter(),
      new ModeFilter(),
      new DifficultyFilter(),
      new FreeFilter(),
      new SkillsFilter(),
      new RegistrationOpenFilter(),
      new SearchFilter(),
      new PrizePoolFilter(),
    ];
  }

  /**
   * Builds the base query and applies all matching strategies.
   * @param {Object} params - req.query object
   * @returns {Object} MongoDB filter document
   */
  build(params = {}) {
    const query = {
      status:     { $in: ['published', 'ongoing'] },
      visibility: 'public',
      deletedAt:  null,
    };

    for (const strategy of this.strategies) {
      if (strategy.applies(params)) {
        strategy.apply(query, params);
      }
    }

    return query;
  }

  /** Returns a sort document from a known sort key string. */
  buildSort(sortKey = 'createdAt') {
    const sortMap = {
      createdAt: { createdAt: -1 },
      prizePool:  { 'prizes.0.amount': -1 },
      deadline:   { 'timeline.registrationClose': 1 },
      popular:    { registrationCount: -1 },
    };
    return sortMap[sortKey] || { createdAt: -1 };
  }
}

export default new HackathonQueryBuilder();
