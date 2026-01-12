import User from '../models/User.js';
import Connection from '../models/Connection.js'; // <--- THIS IMPORT IS CRITICAL
import Post from '../models/Post.js'; // Ensure Post is imported if you use it in other functions
import cloudinary from '../config/cloudinary.js';

// --- POSTS LOGIC ---
export const createPost = async (req, res) => {
  try {
    const { text, userId } = req.body;
    let imageUrl = "";

    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "uniconnect_posts" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });
      imageUrl = uploadResult.secure_url;
    }

    const newPost = await Post.create({
      user: userId,
      text: text || "",
      image: imageUrl,
    });
    await newPost.populate('user', 'name institute'); 
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({ message: "Post creation failed" });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name institute')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleLike = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.body.userId;
      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ message: "Post not found" });
  
      const isLiked = post.likes.includes(userId);
      if (isLiked) {
        post.likes = post.likes.filter((uid) => uid.toString() !== userId);
      } else {
        post.likes.push(userId);
      }
      await post.save();
      res.json(post.likes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};
  
export const addComment = async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, text } = req.body;
      const post = await Post.findById(id);
      if (!post) return res.status(404).json({ message: "Post not found" });
  
      post.comments.push({ user: userId, text, createdAt: new Date() });
      await post.save();
      
      const updatedPost = await Post.findById(id).populate("comments.user", "name");
      res.json(updatedPost.comments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

// --- NETWORK / CONNECTION LOGIC ---

export const sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId) return res.status(400).json({ message: "Cannot connect to yourself" });

    // Check existing
    const existing = await Connection.findOne({
      $or: [
        { requester: senderId, recipient: receiverId },
        { requester: receiverId, recipient: senderId }
      ]
    });

    if (existing) {
      if (existing.status === 'pending') return res.status(400).json({ message: "Request already pending" });
      if (existing.status === 'accepted') return res.status(400).json({ message: "Already connected" });
      return res.status(400).json({ message: "Cannot send request" });
    }

    await Connection.create({ requester: senderId, recipient: receiverId, status: 'pending' });
    res.json({ success: true, message: "Request sent" });
  } catch (error) {
    console.error("Send Request Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const respondToInvite = async (req, res) => {
  try {
    const userId = req.user._id; 
    const { connectionId, action } = req.body;

    const connection = await Connection.findById(connectionId);
    if (!connection) return res.status(404).json({ message: "Request not found" });

    if (connection.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (action === 'accept') {
      connection.status = 'accepted';
      await connection.save();
    } else {
      await Connection.findByIdAndDelete(connectionId); 
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNetwork = async (req, res) => {
  try {
    const userId = req.user._id;

    const invitations = await Connection.find({ recipient: userId, status: 'pending' })
      .populate('requester', 'name institute headline'); 

    const connections = await Connection.find({
      $or: [
        { requester: userId, recipient: { $ne: userId } }, 
        { recipient: userId, requester: { $ne: userId } }  
      ],
      status: 'accepted'
    })
    .populate('requester', 'name institute headline')
    .populate('recipient', 'name institute headline');

    const formattedConnections = connections.map(conn => {
      return conn.requester._id.toString() === userId.toString() ? conn.recipient : conn.requester;
    });

    const formattedInvites = invitations.map(inv => ({
       _id: inv._id, 
       user: inv.requester 
    }));

    res.json({ invitations: formattedInvites, connections: formattedConnections });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- DISCOVER / SUGGESTIONS LOGIC ---

export const getDiscoverUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    // 1. Get my relationships status
    const myRelationships = await Connection.find({
      $or: [{ requester: currentUserId }, { recipient: currentUserId }]
    });

    const statusMap = {};
    myRelationships.forEach(rel => {
      const otherId = rel.requester.toString() === currentUserId ? rel.recipient.toString() : rel.requester.toString();
      statusMap[otherId] = rel.status; // 'pending' or 'accepted'
    });

    // 2. Fetch Users (excluding self)
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('name institute headline')
      .limit(20);

    // 3. Map status
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      institute: user.institute,
      headline: user.headline,
      status: statusMap[user._id.toString()] || 'none'
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Discover Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get Profile by Username
export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find user where "username" field matches (Case insensitive is better)
    const user = await User.findOne({ username }).select('-password');
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ... existing imports

// Update MY Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body; 

    // Security: Prevent users from changing sensitive fields via this route
    delete updates.password;
    delete updates.email; 
    delete updates.role;
    delete updates._id;

    // The { new: true } option ensures we get back the updated document
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    
    res.json(user);
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: error.message });
  }
};