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
} from '../controllers/publicController.js';

const router = express.Router();

// Apply stricter rate limiter to all /api/public/* routes.
// auth middleware is intentionally NOT applied here.
router.use(publicApiLimiter);

// ── Feed
router.get('/feed',    getPublicFeed);

// ── Mentors
router.get('/mentors',             getPublicMentors);
router.get('/mentors/:username',   getPublicMentorByUsername);

// ── Hackathons
router.get('/hackathons',          getPublicHackathons);
router.get('/hackathons/:slug',    getPublicHackathonBySlug);

// ── Profile
router.get('/profile/:username',   getPublicProfile);

// ── Post
router.get('/post/:id',            getPublicPost);

// ── Group (uses _id as slug since Group model has no slug field)
router.get('/groups/:slug',        getPublicGroup);

// ── Sitemap data (consumed by Next.js sitemap.js)
router.get('/sitemap',             getSitemapData);

export default router;
