import express, { request } from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { createGroup, getGroups, joinGroup, getGroupMessages , requestToJoinGroup, getGroupRequests, handleJoinRequest, getGroupById} from '../controllers/groupController.js';
import upload from '../middlewares/upload.js'; // Ensure you have multer config

const router = express.Router();

router.post('/', protect, upload.single('image'), createGroup);
router.get('/', protect, getGroups);
router.post('/join', protect, joinGroup);
router.get('/:groupId/messages', protect, getGroupMessages);
router.post('/request-join', protect, requestToJoinGroup);
router.get('/:groupId/requests', protect, getGroupRequests);
router.post('/handle-request', protect, handleJoinRequest);
router.get('/:id', protect, getGroupById);

export default router;