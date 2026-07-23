import express from 'express';
import { protect, authorizeRole } from '../middlewares/authMiddleware.js';
import { 
  listPods, getPodById, joinPod,
  createPod, adminListPods, assignStudent,
  getMentorPods, createAssignment, scheduleMeeting, postAnnouncement,
  getStudentPods, getAssignments, submitAssignment
} from '../controllers/podController.js';

const router = express.Router();

// Public / General Authenticated
router.get('/', listPods);
router.get('/:id', getPodById);
router.post('/:id/join', protect, joinPod);

// Admin Routes
router.post('/admin/create', protect, authorizeRole('admin'), createPod);
router.get('/admin/all', protect, authorizeRole('admin'), adminListPods);
router.post('/admin/:id/assign', protect, authorizeRole('admin'), assignStudent);

// Mentor Routes
router.get('/mentor/my-pods', protect, authorizeRole('mentor', 'admin'), getMentorPods);
router.post('/:id/assignments', protect, authorizeRole('mentor', 'admin'), createAssignment);
router.post('/:id/meetings', protect, authorizeRole('mentor', 'admin'), scheduleMeeting);
router.post('/:id/announcements', protect, authorizeRole('mentor', 'admin'), postAnnouncement);

// Student Routes
router.get('/student/my-pods', protect, authorizeRole('student'), getStudentPods);
router.get('/:id/assignments', protect, getAssignments);
router.post('/:id/assignments/:assignmentId/submit', protect, submitAssignment);

export default router;
