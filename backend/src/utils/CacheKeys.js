/**
 * CacheKeys — Centralized cache key factory.
 *
 * SOLID applied:
 *  - DIP: Services depend on this abstraction rather than embedding string
 *         templates inline. If a key format changes, we update here only.
 *  - SRP: One place owns all cache key naming conventions.
 *  - OCP: New domains add new static methods without touching existing ones.
 *
 * Design Pattern: Flyweight (key strings shared and constructed once per call)
 */
class CacheKeys {

  // ─── Hackathon ────────────────────────────────────────────────────────────

  /** Paginated hackathon discovery list */
  static hackathonList(params)  { return `hackathons:list:${JSON.stringify(params)}`; }

  /** Single hackathon by URL slug */
  static hackathonBySlug(slug)  { return `hackathon:slug:${slug}`; }

  /** Wildcard to bust all list caches */
  static hackathonListAll()     { return 'hackathons:list:*'; }

  // ─── AI Features ──────────────────────────────────────────────────────────

  /** AI team member suggestions for a user in a hackathon */
  static aiTeamSuggestions(hackathonId, userId) {
    return `ai:team_suggestions:${hackathonId}:${userId}`;
  }

  /** AI skill gap analysis for a team */
  static aiSkillGap(hackathonId, teamId) {
    return `ai:skill_gap:${hackathonId}:${teamId}`;
  }

  // ─── Registration ─────────────────────────────────────────────────────────

  /** Distributed lock for a user's registration attempt */
  static registrationLock(hackathonId, userId) {
    return `hackathon_reg_lock:${hackathonId}:${userId}`;
  }

  // ─── Notifications ────────────────────────────────────────────────────────

  /** Per-user notification cache */
  static notifications(userId) { return `notifications:${userId}`; }
}

export default CacheKeys;
