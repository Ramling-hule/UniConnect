import express from 'express';
import { getCareerRecommendations, handleCareerChat } from '../controllers/careerController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply auth protection middleware
router.use(protect);

router.post('/recommend', getCareerRecommendations);
router.post('/chat', handleCareerChat);

export default router;
