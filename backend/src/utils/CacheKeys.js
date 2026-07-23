class CacheKeys {
  static hackathonList(params)  { return `hackathons:list:${JSON.stringify(params)}`; }
  static hackathonBySlug(slug)  { return `hackathon:slug:${slug}`; }
  static hackathonListAll()     { return 'hackathons:list:*'; }
  static aiTeamSuggestions(hackathonId, userId) {
    return `ai:team_suggestions:${hackathonId}:${userId}`;
  }
  static aiSkillGap(hackathonId, teamId) {
    return `ai:skill_gap:${hackathonId}:${teamId}`;
  }
  static registrationLock(hackathonId, userId) {
    return `hackathon_reg_lock:${hackathonId}:${userId}`;
  }
  static notifications(userId) { return `notifications:${userId}`; }
}

export default CacheKeys;
