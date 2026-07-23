import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import Pod from '../models/Pod.js';
import PodMember from '../models/PodMember.js';
import Assignment from '../models/Assignment.js';
import Booking from '../models/Booking.js';
import PodMessage from '../models/PodMessage.js';
export const listPods = asyncHandler(async (req, res) => {
  const pods = await Pod.find({ status: { $in: ['FORMING', 'ACTIVE'] } })
    .populate('mentorId', 'name username profilePicture headline')
    .sort({ createdAt: -1 })
    .lean();
  const podsWithCounts = await Promise.all(pods.map(async (pod) => {
    const memberCount = await PodMember.countDocuments({ podId: pod._id, status: 'ACTIVE' });
    return { ...pod, memberCount };
  }));

  res.status(200).json({ success: true, pods: podsWithCounts });
});
export const getPodById = asyncHandler(async (req, res) => {
  const pod = await Pod.findById(req.params.id)
    .populate('mentorId', 'name username profilePicture headline about')
    .lean();

  if (!pod) {
    res.status(404);
    throw new Error('Pod not found');
  }
  const members = await PodMember.find({ podId: pod._id, status: 'ACTIVE' })
    .populate('userId', 'name username profilePicture headline')
    .lean();

  res.status(200).json({ success: true, pod, members, memberCount: members.length });
});
export const joinPod = asyncHandler(async (req, res) => {
  const podId = req.params.id;
  const userId = req.user._id;

  const pod = await Pod.findById(podId);
  if (!pod) {
    res.status(404);
    throw new Error('Pod not found');
  }

  if (pod.status !== 'FORMING' && pod.status !== 'ACTIVE') {
    res.status(400);
    throw new Error('This pod is not open for new members');
  }
  const existingMember = await PodMember.findOne({ podId, userId });
  if (existingMember) {
    if (existingMember.status === 'ACTIVE') {
      res.status(400);
      throw new Error('You are already a member of this pod');
    } else {
      existingMember.status = 'ACTIVE';
      existingMember.joinedAt = new Date();
      await existingMember.save();
      return res.status(200).json({ success: true, message: 'Rejoined pod successfully', member: existingMember });
    }
  }
  const memberCount = await PodMember.countDocuments({ podId, status: 'ACTIVE' });
  if (memberCount >= pod.maxSize) {
    res.status(400);
    throw new Error('This pod is already at maximum capacity');
  }
  const member = await PodMember.create({
    podId,
    userId,
    role: 'STUDENT',
    status: 'ACTIVE',
    joinedAt: new Date()
  });

  res.status(201).json({ success: true, message: 'Joined pod successfully', member });
});

// --- Admin ---
export const createPod = asyncHandler(async (req, res) => {
  const pod = await Pod.create(req.body);
  res.status(201).json({ success: true, pod });
});

export const adminListPods = asyncHandler(async (req, res) => {
  const pods = await Pod.find().populate('mentorId', 'name username').lean();
  res.status(200).json({ success: true, pods });
});

export const assignStudent = asyncHandler(async (req, res) => {
  const { studentId, role } = req.body;
  const member = await PodMember.create({
    podId: req.params.id,
    userId: studentId,
    role: role || 'STUDENT',
    status: 'ACTIVE',
  });
  res.status(201).json({ success: true, member });
});

// --- Mentor ---
export const getMentorPods = asyncHandler(async (req, res) => {
  const pods = await Pod.find({ mentorId: req.user._id }).lean();
  res.status(200).json({ success: true, pods });
});

export const createAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.create({
    podId: req.params.id,
    milestoneId: req.body.milestoneId || null,
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    totalPoints: req.body.totalPoints
  });
  res.status(201).json({ success: true, assignment });
});

export const scheduleMeeting = asyncHandler(async (req, res) => {
  const booking = await Booking.create({
    mentor: req.user._id,
    user: req.user._id, // The mentor is booking a group session
    podId: req.params.id,
    type: 'pod_meeting',
    status: 'scheduled',
    date: req.body.date,
    time: req.body.time,
    title: req.body.title,
    duration: req.body.duration || 60,
    meetingLink: req.body.meetingLink
  });
  res.status(201).json({ success: true, booking });
});

export const postAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await PodMessage.create({
    podId: req.params.id,
    senderId: req.user._id,
    content: req.body.content,
    type: 'ANNOUNCEMENT'
  });
  res.status(201).json({ success: true, announcement });
});

// --- Student ---
export const getStudentPods = asyncHandler(async (req, res) => {
  const memberships = await PodMember.find({ userId: req.user._id, status: 'ACTIVE' }).lean();
  const podIds = memberships.map(m => m.podId);
  const pods = await Pod.find({ _id: { $in: podIds } }).populate('mentorId', 'name username').lean();
  res.status(200).json({ success: true, pods });
});

export const getAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ podId: req.params.id }).lean();
  res.status(200).json({ success: true, assignments });
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  const submission = {
    userId: req.user._id,
    content: req.body.content,
    repoUrl: req.body.repoUrl,
    submittedAt: new Date()
  };
  assignment.submissions.push(submission);
  await assignment.save();
  res.status(200).json({ success: true, assignment });
});
