import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getLeaderRequests, acceptInterestRequest, rejectInterestRequest, transferLeadership } from '../controllers/teamManagementController.js';

const router = express.Router();
router.use(protect);

router.get('/leader/requests', getLeaderRequests);
router.post('/:id/requests/:requestId/accept', acceptInterestRequest);
router.post('/:id/requests/:requestId/reject', rejectInterestRequest);
router.post('/:id/transfer-leadership', transferLeadership);

export default router;

