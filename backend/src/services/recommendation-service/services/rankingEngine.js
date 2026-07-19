// rankingEngine.js
// ML-inspired Heuristic Ranking Algorithm

class RankingEngine {
  /**
   * Scores and ranks candidate mentors based on multiple factors.
   * This is abstracted to easily swap with an XGBoost/LTR API call later.
   * 
   * @param {Array} pineconeMatches - Top K matches from Vector DB (with semantic scores)
   * @param {Object} studentProfile - The student's preferences and profile
   * @returns {Array} Sorted array of top N recommended mentors
   */
  async rankCandidates(pineconeMatches, studentProfile) {
    const W_SEMANTIC = 0.5;
    const W_BUSINESS = 0.3;
    const W_PERSONALIZATION = 0.2;

    const scoredCandidates = pineconeMatches.map(match => {
      // 1. Semantic Match from Pinecone (Cosine Similarity)
      const semanticScore = match.score; // e.g., 0.85

      // 2. Business Score (Response rate, Completion rate, Experience)
      // Assuming metadata contains these fields
      const meta = match.metadata || {};
      const responseRate = meta.responseRate || 0.8;
      const completionRate = meta.completionRate || 0.8;
      const sessions = meta.totalSessions || 1;
      
      const businessScore = (responseRate * 0.4) + (completionRate * 0.4) + (Math.min(Math.log10(sessions) / 3, 1) * 0.2);

      // 3. Personalization Score (Budget, Timezone overlap)
      let personalizationScore = 1.0;
      if (meta.hourlyPrice > studentProfile.budget) {
        personalizationScore -= 0.5; // Heavy penalty for being over budget
      }
      if (meta.timezone !== studentProfile.timezone) {
        personalizationScore -= 0.2; // Slight penalty for different timezone
      }

      // Calculate Total Score
      const totalScore = (semanticScore * W_SEMANTIC) + (businessScore * W_BUSINESS) + (personalizationScore * W_PERSONALIZATION);

      return {
        mentorId: match.id,
        metadata: meta,
        totalScore,
        breakdown: { semanticScore, businessScore, personalizationScore }
      };
    });

    // Sort by Total Score descending
    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);

    // Re-ranking phase: Diversity & Freshness (Stubbed)
    const reranked = this._applyDiversityPenalty(scoredCandidates);

    // Return Top 20
    return reranked.slice(0, 20);
  }

  _applyDiversityPenalty(candidates) {
    // Logic to prevent top 5 from all being from the same company
    return candidates; 
  }
}

export default new RankingEngine();
