import express from 'express';
import { getDirectMessages, searchMessages } from '../controllers/messageController.js';

const router = express.Router();

router.get('/:userId/:otherId', getDirectMessages);
router.get('/search/:userId/:otherId', searchMessages);

export default router;
