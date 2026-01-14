import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { createGroup, getGroups, joinGroup, getGroupMessages } from '../controllers/groupController.js';
import upload from '../middlewares/upload.js'; // Ensure you have multer config

const router = express.Router();

router.post('/', protect, upload.single('image'), createGroup);
router.get('/', protect, getGroups);
router.post('/join', protect, joinGroup);
router.get('/:groupId/messages', protect, getGroupMessages);

export default router;