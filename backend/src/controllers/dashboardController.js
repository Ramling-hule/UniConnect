import User from '../models/User.js';
import Connection from '../models/Connection.js'; 
import Post from '../models/Post.js'; 
import cloudinary from '../config/cloudinary.js';
import redisClient from '../config/redis.js'; 
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

// --- POSTS LOGIC ---

export const createPost = asyncHandler(async (req, res, next) => {
  const { text, userId } = req.body;
  let imageUrl = "";

  if (req.file) {
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "uniconnect_posts" },
        (error, result) => {
          if (error) reject(new AppError("Post creation failed due to upload error", 500));
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
  
  try {
    if (redisClient.isReady) {
      await redisClient.del('posts:all');
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache invalidation:', redisErr.message);
  }

  res.status(201).json(newPost);
});

export const getPosts = asyncHandler(async (req, res, next) => {
  let cachedPosts = null;
  
  try {
    if (redisClient.isReady) {
      cachedPosts = await redisClient.get('posts:all');
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache read:', redisErr.message);
  }
  
  if (cachedPosts) {
    return res.status(200).json(JSON.parse(cachedPosts));
  }

  const posts = await Post.find()
    .populate('user', 'name profilePicture') 
    .populate({
      path: 'comments.user', 
      select: 'name profilePicture' 
    })
    .sort({ createdAt: -1 });

  try {
    if (posts.length > 0 && redisClient.isReady) {
      await redisClient.setEx('posts:all', 3600, JSON.stringify(posts));
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache write:', redisErr.message);
  }

  res.status(200).json(posts);
});

export const toggleLike = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.body.userId;
  const post = await Post.findById(id);
  if (!post) return next(new AppError("Post not found", 404));

  const isLiked = post.likes.includes(userId);
  if (isLiked) {
    post.likes = post.likes.filter((uid) => uid.toString() !== userId);
  } else {
    post.likes.push(userId);
  }
  await post.save();

  try {
    if (redisClient.isReady) {
      await redisClient.del('posts:all');
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache invalidation:', redisErr.message);
  }

  res.json(post.likes);
});
  
export const addComment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { userId, text } = req.body;
  const post = await Post.findById(id);
  if (!post) return next(new AppError("Post not found", 404));

  post.comments.push({ user: userId, text, createdAt: new Date() });
  await post.save();
  
  const updatedPost = await Post.findById(id).populate("comments.user", "name");

  try {
    if (redisClient.isReady) {
      await redisClient.del('posts:all');
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache invalidation:', redisErr.message);
  }

  res.json(updatedPost.comments);
});

// --- NETWORK / CONNECTION LOGIC ---

export const sendConnectionRequest = asyncHandler(async (req, res, next) => {
  const { receiverId } = req.body;
  const senderId = req.user._id;

  if (senderId.toString() === receiverId) return next(new AppError("Cannot connect to yourself", 400));

  const existing = await Connection.findOne({
    $or: [
      { requester: senderId, recipient: receiverId },
      { requester: receiverId, recipient: senderId }
    ]
  });

  if (existing) {
    if (existing.status === 'pending') return next(new AppError("Request already pending", 400));
    if (existing.status === 'accepted') return next(new AppError("Already connected", 400));
    return next(new AppError("Cannot send request", 400));
  }

  await Connection.create({ requester: senderId, recipient: receiverId, status: 'pending' });

  res.json({ success: true, message: "Request sent" });
});

export const respondToInvite = asyncHandler(async (req, res, next) => {
  const userId = req.user._id; 
  const { connectionId, action } = req.body;

  const connection = await Connection.findById(connectionId);
  if (!connection) return next(new AppError("Request not found", 404));

  if (connection.recipient.toString() !== userId.toString()) {
    return next(new AppError("Not authorized", 403));
  }

  if (action === 'accept') {
    connection.status = 'accepted';
    await connection.save();
  } else {
    await Connection.findByIdAndDelete(connectionId); 
  }

  res.json({ success: true });
});

export const getNetwork = asyncHandler(async (req, res, next) => {
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
});

// --- DISCOVER / SUGGESTIONS LOGIC ---

export const getDiscoverUsers = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user._id.toString();

  const myRelationships = await Connection.find({
    $or: [{ requester: currentUserId }, { recipient: currentUserId }]
  });

  const statusMap = {};
  myRelationships.forEach(rel => {
    const otherId = rel.requester.toString() === currentUserId ? rel.recipient.toString() : rel.requester.toString();
    statusMap[otherId] = rel.status; 
  });

  const users = await User.find({ _id: { $ne: currentUserId } })
    .select('name institute headline')
    .limit(20);

  const formattedUsers = users.map(user => ({
    _id: user._id,
    name: user.name,
    institute: user.institute,
    headline: user.headline,
    status: statusMap[user._id.toString()] || 'none'
  }));

  res.json(formattedUsers);
});

export const getUserByUsername = asyncHandler(async (req, res, next) => {
  const { username } = req.params;
  let cachedUser = null;

  try {
    if (redisClient.isReady) {
      cachedUser = await redisClient.get(`profile:${username}`);
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache read:', redisErr.message);
  }

  if (cachedUser) {
      return res.json(JSON.parse(cachedUser));
  }

  const user = await User.findOne({ username }).select('-password');
  
  if (!user) return next(new AppError("User not found", 404));
  
  try {
    if (redisClient.isReady) {
      await redisClient.setEx(`profile:${username}`, 3600, JSON.stringify(user));
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache write:', redisErr.message);
  }

  res.json(user);
});

export const updateProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const updates = req.body; 

  delete updates.password;
  delete updates.email; 
  delete updates.role;
  delete updates._id;

  const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
  
  try {
    if (user && user.username && redisClient.isReady) {
      await redisClient.del(`profile:${user.username}`);
    }
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable, skipping cache invalidation:', redisErr.message);
  }

  res.json(user);
});

export const getSuggestions = asyncHandler(async (req, res, next) => {
  const currentUserId = req.user?.id || req.userId;

  const currentUser = await User.findById(currentUserId).select('following');
  const excludeIds = [...(currentUser?.following || []), currentUserId];

  const suggestions = await User.find({
    _id: { $nin: excludeIds }
  })
  .select('name institute profilePicture') 
  .limit(10); 

  res.status(200).json(suggestions);
});