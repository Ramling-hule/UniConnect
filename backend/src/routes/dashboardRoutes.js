import express from 'express';
import upload from '../middlewares/upload.js';
import { protect } from '../middlewares/authMiddleware.js';
import { getNetwork, respondToInvite } from '../controllers/dashboardController.js';
import { 
  createPost, 
  getPosts, 
  getSuggestions, 
  toggleLike,
  addComment ,
  getDiscoverUsers, 
  sendConnectionRequest
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/posts', getPosts);
router.get('/suggestions', getSuggestions);
router.post('/posts', upload.single('file'), createPost);

// Now these will work because they are imported above
router.put('/posts/:id/like', toggleLike);
router.post('/posts/:id/comment', addComment);
router.get('/network', protect, getNetwork);
router.post('/network/respond', protect, respondToInvite);
router.get('/suggestions', protect, getDiscoverUsers); 

// New Route for sending requests
router.post('/connect', protect, sendConnectionRequest);

export default router;