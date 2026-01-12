import express from 'express';
import upload from '../middlewares/upload.js';
import { protect } from '../middlewares/authMiddleware.js';
import { getNetwork, getUserByUsername, respondToInvite, updateProfile } from '../controllers/dashboardController.js';
import { 
  createPost, 
  getPosts, 
  toggleLike,
  addComment ,
  getDiscoverUsers, 
  sendConnectionRequest
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/posts', getPosts);
router.post('/posts', upload.single('file'), createPost);

// Now these will work because they are imported above
router.put('/posts/:id/like', toggleLike);
router.post('/posts/:id/comment', addComment);
router.get('/network', protect, getNetwork);
router.post('/network/respond', protect, respondToInvite);
router.get('/suggestions', protect, getDiscoverUsers); 

// New Route for sending requests
router.post('/connect', protect, sendConnectionRequest);
router.get('/u/:username', protect, getUserByUsername);
router.put('/user/profile', protect, updateProfile);

export default router;