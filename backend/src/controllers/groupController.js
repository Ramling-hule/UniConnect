import Group from '../models/Group.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
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

    // 1. Upload Group Icon to Cloudinary
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

    // 2. Determine Institute (Only for private groups)
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
        admin: [creatorId], // Initialize admin array with creator
        members: [creatorId], // Creator is also a member
        image: imageUrl,
        inviteCode: uuidv4().slice(0, 8) // Generate unique invite code
    });

    // 4. Populate admin details for immediate frontend display
    await newGroup.populate('admin', 'name profilePicture');

    // 5. Format response
    const formattedGroup = {
        ...newGroup.toObject(),
        image: formatUrl(newGroup.image),
        admin: newGroup.admin.map(a => ({
            ...a.toObject(),
            profilePicture: formatUrl(a.profilePicture)
        }))
    };

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
        const user = await User.findById(userId);

        // Fetch groups that are:
        // 1. Public
        // 2. Private but belong to User's Institute
        // 3. Groups the user is ALREADY in (even if they changed institutes)
        const groups = await Group.find({
            $or: [
                { privacy: 'public' },
                { privacy: 'private', institute: user.institute },
                { members: userId }
            ]
        })
        .populate('admin', 'name profilePicture')
        .sort({ createdAt: -1 });

        // Format data for frontend
        const formattedGroups = groups.map(g => {
            // Check if current user is an admin
            const isAdmin = g.admin.some(admin => admin._id.toString() === userId.toString());

            return {
                ...g.toObject(),
                image: formatUrl(g.image),
                isMember: g.members.includes(userId),
                isAdmin: isAdmin,
                admin: g.admin.map(a => ({
                    ...a.toObject(),
                    profilePicture: formatUrl(a.profilePicture)
                }))
            };
        });

        res.json(formattedGroups);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- JOIN GROUP ---
export const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.body;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if(!group) return res.status(404).json({message: "Group not found"});

        // Check if user is already a member
        if(!group.members.includes(userId)) {
            group.members.push(userId);
            await group.save();
            res.json({ success: true, message: "Joined successfully" });
        } else {
            res.status(400).json({ message: "Already a member" });
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- GET GROUP CHAT HISTORY ---
export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Fetch messages for this group
        const messages = await Message.find({ group: groupId })
            .populate('sender', 'name profilePicture')
            .sort({ createdAt: 1 });
        
        // Format sender images
        const formattedMessages = messages.map(m => ({
            ...m.toObject(),
            sender: {
                ...m.sender.toObject(),
                profilePicture: formatUrl(m.sender.profilePicture)
            }
        }));

        res.json(formattedMessages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};