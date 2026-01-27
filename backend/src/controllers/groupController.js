import Group from '../models/Group.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js'; 
import cloudinary from '../config/cloudinary.js';
import redisClient from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';

// --- HELPER FUNCTION ---
const formatUrl = (url) => {
  if (!url) return "";
  if (url.startsWith('http') || url.startsWith('https')) return url;
  return `${process.env.BASE_URL}/${url}`;
};

// --- CREATE GROUP ---
export const createGroup = async (req, res) => {
  try {
    const { name, description, privacy } = req.body;
    const creatorId = req.user._id;
    let imageUrl = "";

    // 1. Upload Group Icon (Specific logic for Group creation)
    if (req.file) {
       const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
             { folder: "uniconnect_groups" },
             (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(req.file.buffer);
       });
       imageUrl = uploadResult.secure_url;
    }

    // 2. Determine Institute
    let institute = null;
    if (privacy === 'private') {
        const user = await User.findById(creatorId);
        institute = user.institute;
    }

    // 3. Create Group
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

    // 👇 INVALIDATE CACHE: User's group list changed
    await redisClient.del(`groups:list:${creatorId}`);

    res.status(201).json(formattedGroup);

  } catch (error) {
    console.error("Create Group Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// --- GET GROUPS LIST ---
export const getGroups = async (req, res) => {
    try {
        const userId = req.user._id;

        // 👇 CHECK REDIS CACHE
        const cachedGroups = await redisClient.get(`groups:list:${userId}`);
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

        // 👇 SAVE TO REDIS (Short expiry: 2 minutes)
        await redisClient.setEx(`groups:list:${userId}`, 120, JSON.stringify(formattedGroups));

        res.json(formattedGroups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- GET SINGLE GROUP ---
// GET /api/groups/:id
// src/controllers/groupController.js

// ... (other imports)

export const getGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch from DB with FULL POPULATION
    const group = await Group.findById(id)
      .populate('joinRequests', 'name profilePicture instituteName headline') 
      .populate('admins', 'name profilePicture') 
      // 👇 THIS IS THE KEY FIX: We explicitly get name, pic, and institute
      .populate('members', 'name profilePicture instituteName'); 

    if (!group) return res.status(404).json({ message: "Group not found" });

    // 2. Save to Redis
    await redisClient.setEx(`group:${id}`, 1800, JSON.stringify(group));

    res.status(200).json(group);

  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ... (rest of the controller)
// --- JOIN REQUESTS ---
export const requestToJoinGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const requesterId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.members.includes(requesterId) || group.admins.includes(requesterId)) {
      return res.status(400).json({ message: "You are already a member of this group" });
    }

    if (group.joinRequests && group.joinRequests.includes(requesterId)) {
      return res.status(400).json({ message: "Request is already pending" });
    }

    group.joinRequests.push(requesterId);
    await group.save();

    // 👇 INVALIDATE CACHE
    await redisClient.del(`group:${groupId}`);
    await redisClient.del(`group_requests:${groupId}`);

    // Create Notifications
    const notificationPromises = group.admins.map(async (adminId) => {
        return Notification.create({
            recipient: adminId,
            sender: requesterId,
            type: 'GROUP_JOIN_REQUEST',
            relatedId: group._id,
            message: `${req.user.name} requested to join "${group.name}"`,
            isRead: false
        });
    });
    await Promise.all(notificationPromises);

    res.status(200).json({ message: "Request sent successfully", groupId: group._id });

  } catch (error) {
    console.error("Join request error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const handleJoinRequest = async (req, res) => {
  try {
    const { groupId, requesterId, action } = req.body;
    const adminId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.admins.includes(adminId)) {
      return res.status(403).json({ message: "Only admins can manage requests" });
    }

    if (!group.joinRequests.includes(requesterId)) {
      return res.status(400).json({ message: "Request not found or already handled" });
    }

    if (action === 'accept') {
      if (!group.members.includes(requesterId)) {
        group.members.push(requesterId);
      }
      await Notification.create({
        recipient: requesterId,
        sender: adminId,
        type: 'GROUP_APPROVED', 
        relatedId: group._id,
        message: `Your request to join "${group.name}" was approved!`,
        isRead: false
      });
      
      // 👇 INVALIDATE REQUESTER'S GROUP LIST
      await redisClient.del(`groups:list:${requesterId}`);
    }

    group.joinRequests = group.joinRequests.filter(
        (id) => id.toString() !== requesterId.toString()
    );

    await group.save();

    // 👇 INVALIDATE GROUP CACHE
    await redisClient.del(`group:${groupId}`);
    await redisClient.del(`group_requests:${groupId}`);

    res.status(200).json({ message: `Request ${action}ed successfully` });

  } catch (error) {
    console.error("Error handling group request:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getGroupRequests = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id; 

    // 👇 CHECK CACHE
    const cachedRequests = await redisClient.get(`group_requests:${groupId}`);
    if (cachedRequests) {
        return res.status(200).json(JSON.parse(cachedRequests));
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.admins.includes(userId)) return res.status(403).json({ message: "Access denied. Admins only." });

    await group.populate({
      path: 'joinRequests',
      select: 'name profilePicture instituteName headline' 
    });

    // 👇 SAVE CACHE
    await redisClient.setEx(`group_requests:${groupId}`, 300, JSON.stringify(group.joinRequests));

    res.status(200).json(group.joinRequests);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- JOIN GROUP DIRECTLY ---
export const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if(!group) return res.status(404).json({message: "Group not found"});

        if(!group.members.includes(userId)) {
            group.members.push(userId);
            await group.save();

            // 👇 INVALIDATE CACHE
            await redisClient.del(`group:${groupId}`);
            await redisClient.del(`groups:list:${userId}`);

            res.json({ success: true, message: "Joined successfully" });
        } else {
            res.status(400).json({ message: "Already a member" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- CHAT MESSAGES ---
export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;

        // 👇 CHECK CACHE
        const cachedMessages = await redisClient.get(`group_messages:${groupId}`);
        if (cachedMessages) {
             return res.json(JSON.parse(cachedMessages));
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

        // 👇 SAVE CACHE (Short TTL)
        await redisClient.setEx(`group_messages:${groupId}`, 60, JSON.stringify(formattedMessages));

        res.json(formattedMessages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- GET GROUP MEDIA (FILES & IMAGES) ---
export const getGroupMedia = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Find messages in this group that have a fileUrl
        // We select specific fields to keep the query light
        const mediaMessages = await Message.find({ 
            group: groupId, 
            fileUrl: { $ne: "" } // $ne means "not equal"
        })
        .populate('sender', 'name')
        .select('fileUrl fileType fileName createdAt sender')
        .sort({ createdAt: -1 }); // Newest first

        res.json(mediaMessages);
    } catch (error) {
        console.error("Get Media Error:", error);
        res.status(500).json({ message: "Failed to fetch media" });
    }
};

// --- DELETE GROUP ---
export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Check if user is an admin
        if (!group.admins.includes(userId)) {
            return res.status(403).json({ message: "Only admins can delete the group" });
        }

        // 1. Delete all messages
        await Message.deleteMany({ group: groupId });

        // 2. Delete all notifications related to this group
        await Notification.deleteMany({ relatedId: groupId });

        // 3. Delete the group itself
        await Group.findByIdAndDelete(groupId);

        // 4. Clear Redis Cache
        await redisClient.del(`group:${groupId}`);
        await redisClient.del(`group_messages:${groupId}`);
        await redisClient.del(`group_requests:${groupId}`);
        
        // Invalidate list cache for all members (heavy operation, but necessary)
        // Ideally, use a pattern match or iterate if you have a huge userbase.
        // For now, we rely on TTL expiry for other users, but we clear the deleter's cache.
        await redisClient.del(`groups:list:${userId}`);

        res.json({ message: "Group deleted successfully" });

    } catch (error) {
        console.error("Delete Group Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};