// recommendationController.js
// Exposed REST APIs for fetching recommendations

import pineconeService from '../services/pineconeService.js';
import rankingEngine from '../services/rankingEngine.js';
import User from '../../../models/User.js';

export const getMentorRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { algorithm_version = 'v1' } = req.query;

    // 1. Fetch Student Profile
    const student = await User.findById(userId);
    if (!student) return res.status(404).json({ message: 'User not found' });

    // 2. Candidate Generation (Vector DB Search)
    // Normally, we generate an embedding for the student's goals right here,
    // or fetch a pre-computed one from Redis.
    const mockStudentVector = new Array(1536).fill(0.1); 
    
    // Single-Stage Filter: Only fetch active mentors under double their budget
    const filters = {
      isActive: true,
      hourlyPrice: { $lte: (student.budget || 50) * 2 } 
    };

    const candidates = await pineconeService.querySimilar(mockStudentVector, filters, 100);

    // 3. ML Scoring and Re-ranking
    const recommendations = await rankingEngine.rankCandidates(candidates, student);

    res.status(200).json({
      success: true,
      algorithm_version,
      count: recommendations.length,
      data: recommendations
    });

  } catch (error) {
    console.error('Recommendation Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate recommendations' });
  }
};
