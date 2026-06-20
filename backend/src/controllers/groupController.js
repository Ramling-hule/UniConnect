import Group from '../models/Group.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js'; 
import cloudinary from '../config/cloudinary.js';
import notificationManager from '../services/notificationService.js';
import redisClient from '../config/redis.js';
import { env } from '../config/env.js';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

// --- HELPER FUNCTION ---
const formatUrl = (url) => {
  if (!url) return "";
  if (url.startsWith('http') || url.startsWith('https')) return url;
  return `${env.baseUrl}/${url}`;
};

// --- CREATE GROUP ---
export const createGroup = asyncHandler(async (req, res, next) => {
  const { name, description, privacy } = req.body;
  const creatorId = req.user._id;
  let imageUrl = "";

  if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "uniconnect_groups" },
            (error, result) => (error ? reject(new AppError("Failed to upload group image", 500)) : resolve(result))
        );
        stream.end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url;
  }

  let institute = null;
  if (privacy === 'private') {
      const user = await User.findById(creatorId);
      institute = user.institute;
  }

  const newGroup = await Group.create({
      name,
      description,
      privacy,
      institute,
      admins: [creatorId], 
      members: [creatorId], 
      image: imageUrl,
      inviteCode: uuidv4().slice(0, 8) 
  });

  await newGroup.populate('admins', 'name profilePicture');

  const formattedGroup = {
      ...newGroup.toObject(),
      image: formatUrl(newGroup.image),
      admins: newGroup.admins.map(a => ({
          ...a.toObject(),
          profilePicture: formatUrl(a.profilePicture)
      }))
  };

  try {
    if (redisClient.isReady) {
      await redisClient.del(`groups:list:${creatorId}`);
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache invalidation:', redisErr.message);
  }

  res.status(201).json(formattedGroup);
});

// --- GET GROUPS LIST ---
export const getGroups = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  let cachedGroups = null;

  try {
    if (redisClient.isReady) {
      cachedGroups = await redisClient.get(`groups:list:${userId}`);
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache read:', redisErr.message);
  }

  if (cachedGroups) {
        return res.json(JSON.parse(cachedGroups));
  }

  const user = await User.findById(userId);

  const groups = await Group.find({
      $or: [
          { privacy: 'public' },
          { privacy: 'private', institute: user.institute },
          { members: userId }
      ]
  })
  .populate('admins', 'name profilePicture')
  .sort({ createdAt: -1 });

  const formattedGroups = groups.map(g => {
      const isAdmin = g.admins.some(admin => admin._id.toString() === userId.toString());
      return {
          ...g.toObject(),
          image: formatUrl(g.image),
          isMember: g.members.includes(userId),
          isAdmin: isAdmin,
          admins: g.admins.map(a => ({
              ...a.toObject(),
              profilePicture: formatUrl(a.profilePicture)
          }))
      };
  });

  try {
    if (redisClient.isReady) {
      await redisClient.setEx(`groups:list:${userId}`, 120, JSON.stringify(formattedGroups));
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache write:', redisErr.message);
  }

  res.json(formattedGroups);
});

// --- GET SINGLE GROUP ---
export const getGroupById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const group = await Group.findById(id)
    .populate('joinRequests', 'name profilePicture instituteName headline') 
    .populate('admins', 'name profilePicture') 
    .populate('members', 'name profilePicture instituteName'); 

  if (!group) return next(new AppError("Group not found", 404));

  try {
    if (redisClient.isReady) {
      await redisClient.setEx(`group:${id}`, 1800, JSON.stringify(group));
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache write:', redisErr.message);
  }

  res.status(200).json(group);
});

// --- JOIN REQUESTS ---
export const requestToJoinGroup = asyncHandler(async (req, res, next) => {
  const { groupId } = req.body;
  const requesterId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) return next(new AppError("Group not found", 404));

  if (group.members.includes(requesterId) || group.admins.includes(requesterId)) {
    return next(new AppError("You are already a member of this group", 400));
  }

  if (group.joinRequests && group.joinRequests.includes(requesterId)) {
    return next(new AppError("Request is already pending", 400));
  }

  group.joinRequests.push(requesterId);
  await group.save();

  try {
    if (redisClient.isReady) {
      await redisClient.del(`group:${groupId}`);
      await redisClient.del(`group_requests:${groupId}`);
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache invalidation:', redisErr.message);
  }

  const io = req.app.get('io');
  const notificationPromises = group.admins.map(async (adminId) => {
      return notificationManager.notify({
          recipientId: adminId,
          senderId: requesterId,
          type: 'GROUP_JOIN_REQUEST',
          relatedId: group._id,
          message: `${req.user.name} requested to join "${group.name}"`
      }, io);
  });
  await Promise.all(notificationPromises);

  res.status(200).json({ message: "Request sent successfully", groupId: group._id });
});

export const handleJoinRequest = asyncHandler(async (req, res, next) => {
  const { groupId, requesterId, action } = req.body;
  const adminId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) return next(new AppError("Group not found", 404));

  if (!group.admins.includes(adminId)) {
    return next(new AppError("Only admins can manage requests", 403));
  }

  if (!group.joinRequests.includes(requesterId)) {
    return next(new AppError("Request not found or already handled", 400));
  }

  if (action === 'accept') {
    if (!group.members.includes(requesterId)) {
      group.members.push(requesterId);
    }
    const io = req.app.get('io');
    await notificationManager.notify({
      recipientId: requesterId,
      senderId: adminId,
      type: 'GROUP_APPROVED', 
      relatedId: group._id,
      message: `Your request to join "${group.name}" was approved!`
    }, io);
    
    if (redisClient.isReady) {
      await redisClient.del(`groups:list:${requesterId}`);
    }
  }

  group.joinRequests = group.joinRequests.filter(
      (id) => id.toString() !== requesterId.toString()
  );

  await group.save();

  if (redisClient.isReady) {
    await redisClient.del(`group:${groupId}`);
    await redisClient.del(`group_requests:${groupId}`);
  }

  res.status(200).json({ message: `Request ${action}ed successfully` });
});

export const getGroupRequests = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user._id; 

  if (redisClient.isReady) {
    const cachedRequests = await redisClient.get(`group_requests:${groupId}`);
    if (cachedRequests) {
        return res.status(200).json(JSON.parse(cachedRequests));
    }
  }

  const group = await Group.findById(groupId);
  if (!group) return next(new AppError("Group not found", 404));

  if (!group.admins.includes(userId)) return next(new AppError("Access denied. Admins only.", 403));

  await group.populate({
    path: 'joinRequests',
    select: 'name profilePicture instituteName headline' 
  });

  if (redisClient.isReady) {
    await redisClient.setEx(`group_requests:${groupId}`, 300, JSON.stringify(group.joinRequests));
  }

  res.status(200).json(group.joinRequests);
});

// --- JOIN GROUP DIRECTLY ---
export const joinGroup = asyncHandler(async (req, res, next) => {
  const { groupId } = req.body;
  const userId = req.user._id;

  const group = await Group.findById(groupId);
  if(!group) return next(new AppError("Group not found", 404));

  if(!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();

      if (redisClient.isReady) {
        await redisClient.del(`group:${groupId}`);
        await redisClient.del(`groups:list:${userId}`);
      }

      res.json({ success: true, message: "Joined successfully" });
  } else {
      return next(new AppError("Already a member", 400));
  }
});

// --- CHAT MESSAGES ---
export const getGroupMessages = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;

  if (redisClient.isReady) {
    const cachedMessages = await redisClient.get(`group_messages:${groupId}`);
    if (cachedMessages) {
          return res.json(JSON.parse(cachedMessages));
    }
  }

  const messages = await Message.find({ group: groupId })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: 1 });
  
  const formattedMessages = messages.map(m => ({
      ...m.toObject(),
      sender: {
          ...m.sender.toObject(),
          profilePicture: formatUrl(m.sender.profilePicture)
      }
  }));

  if (redisClient.isReady) {
    await redisClient.setEx(`group_messages:${groupId}`, 60, JSON.stringify(formattedMessages));
  }

  res.json(formattedMessages);
});

// --- GET GROUP MEDIA (FILES & IMAGES) ---
export const getGroupMedia = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;

  const mediaMessages = await Message.find({ 
      group: groupId, 
      fileUrl: { $ne: "" } 
  })
  .populate('sender', 'name')
  .select('fileUrl fileType fileName createdAt sender')
  .sort({ createdAt: -1 });

  res.json(mediaMessages);
});

// --- DELETE GROUP ---
export const deleteGroup = asyncHandler(async (req, res, next) => {
  const { groupId } = req.params;
  const userId = req.user._id;

  const group = await Group.findById(groupId);
  if (!group) return next(new AppError("Group not found", 404));

  if (!group.admins.includes(userId)) {
      return next(new AppError("Only admins can delete the group", 403));
  }

  await Message.deleteMany({ group: groupId });
  await Notification.deleteMany({ relatedId: groupId });
  await Group.findByIdAndDelete(groupId);

  if (redisClient.isReady) {
    await redisClient.del(`group:${groupId}`);
    await redisClient.del(`group_messages:${groupId}`);
    await redisClient.del(`group_requests:${groupId}`);
    await redisClient.del(`groups:list:${userId}`);
  }

  res.json({ message: "Group deleted successfully" });
});