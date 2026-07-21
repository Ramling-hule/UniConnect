import express from 'express';
import { 
  getPublicProfile, 
  getPublicPost, 
  getPublicGroup, 
  getSitemapData 
} from '../controllers/publicController.js';

const router = express.Router();

router.get('/profile/:username', getPublicProfile);
router.get('/post/:id', getPublicPost);
router.get('/group/:id', getPublicGroup);
router.get('/sitemap', getSitemapData);

export default router;
