import express from 'express';
import { publicApiLimiter } from '../middlewares/rateLimiter.js';
import {
  getPublicFeed,
  getPublicMentors,
  getPublicMentorByUsername,
  getPublicHackathons,
  getPublicHackathonBySlug,
  getPublicProfile,
  getPublicPost,
  getPublicGroup,
  getSitemapData,
  getPublicDiscover,
} from '../controllers/publicController.js';

const router = express.Router();
router.use(publicApiLimiter);
router.get('/feed',    getPublicFeed);
router.get('/mentors',             getPublicMentors);
router.get('/mentors/:username',   getPublicMentorByUsername);
router.get('/hackathons',          getPublicHackathons);
router.get('/hackathons/:slug',    getPublicHackathonBySlug);
router.get('/profile/:username',   getPublicProfile);
router.get('/post/:id',            getPublicPost);
router.get('/groups/:slug',        getPublicGroup);
router.get('/sitemap',             getSitemapData);
router.get('/discover',            getPublicDiscover);

export default router;
