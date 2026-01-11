import User from '../models/User.js';
import Post from '../models/Post.js';
import cloudinary from '../config/cloudinary.js';

// Get 5 random users for "Who to connect"
export const getSuggestions = async (req, res) => {
  try {
    // In a real app, exclude friends. Here, just random sample.
    const suggestions = await User.aggregate([{ $sample: { size: 5 } }]);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a Post


export const createPost = async (req, res) => {
  try {
    const { text, userId } = req.body;
    let imageUrl = "";

    // 1. Check if a file was sent
    if (req.file) {
      // 2. Upload to Cloudinary using a Stream (Best for memory)
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "uniconnect_posts" }, // Cloudinary folder name
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        // Write the file buffer to the stream
        stream.end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
    }

    // 3. Save to MongoDB
    const newPost = await Post.create({
      user: userId,
      text: text || "",
      image: imageUrl, // Save the Cloudinary URL
    });

    // Populate user details for immediate display
    await newPost.populate('user', 'name institute'); 

    res.status(201).json(newPost);
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Post creation failed" });
  }
};

export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name institute username') // Get author details
      .sort({ createdAt: -1 }); // Newest first
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.body.userId; // Sent from frontend

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if user already liked
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike: Remove user ID
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like: Add user ID
      post.likes.push(userId);
    }

    await post.save();
    res.json(post.likes); // Return updated likes array
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add Comment
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;

    const post = await Post.findById(id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = {
      user: userId,
      text,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    // Populate the user details for the new comment immediately
    // Note: We need to reload the post or populate specific path
    const updatedPost = await Post.findById(id).populate("comments.user", "name");
    
    // Return only the latest comments
    res.json(updatedPost.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get Network Data (Invitations & Connections)
export const getNetwork = async (req, res) => {
  try {
    const userId = req.user._id; // Assumes middleware sets req.user
    
    // Fetch user and populate the list details
    const user = await User.findById(userId)
      .populate('invitations', 'name institute headline')
      .populate('connections', 'name institute headline email location');

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      invitations: user.invitations,
      connections: user.connections
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Handle Invitation (Accept or Reject)
export const respondToInvite = async (req, res) => {
  try {
    const userId = req.user._id;         // Me
    const { senderId, action } = req.body; // The person who invited me + action ('accept' | 'reject')

    const me = await User.findById(userId);
    const sender = await User.findById(senderId);

    if (!me || !sender) return res.status(404).json({ message: "User not found" });

    // 1. Remove from invitations regardless of action
    me.invitations = me.invitations.filter(id => id.toString() !== senderId);

    if (action === 'accept') {
      // 2. Add to connections for BOTH users
      if (!me.connections.includes(senderId)) me.connections.push(senderId);
      if (!sender.connections.includes(userId)) sender.connections.push(userId);
      await sender.save();
    }

    await me.save();

    // Return the accepted user details so frontend can update immediately
    res.json({ 
      success: true, 
      newConnection: action === 'accept' ? { _id: sender._id, name: sender.name, headline: sender.headline, institute: sender.institute } : null 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 1. Send Connection Request
export const sendConnectionRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "Cannot send request to yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: "User not found" });

    // Check if already connected or pending
    if (receiver.connections.includes(senderId)) {
      return res.status(400).json({ message: "Already connected" });
    }
    if (receiver.invitations.includes(senderId)) {
      return res.status(400).json({ message: "Request already pending" });
    }

    // Add to invitations
    receiver.invitations.push(senderId);
    await receiver.save();

    res.json({ success: true, message: "Request sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Updated Discover Logic (Checks Status)
export const getDiscoverUsers = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString(); // 1. Convert Me to String

    let users = await User.find({ _id: { $ne: currentUserId } })
      .select('name institute headline invitations connections')
      .limit(20);

    const formattedUsers = users.map(user => {
      let status = 'none'; 

      // 2. Convert arrays to strings for safe comparison
      const connectionIds = user.connections.map(id => id.toString());
      const invitationIds = user.invitations.map(id => id.toString());
      
      // 3. Check relationships
      if (connectionIds.includes(currentUserId)) {
        status = 'connected';
      } else if (invitationIds.includes(currentUserId)) {
        status = 'pending';
      } else if (req.user.invitations.map(id => id.toString()).includes(user._id.toString())) {
        status = 'accept'; // Optional: They sent YOU a request
      }

      return {
        _id: user._id,
        name: user.name,
        institute: user.institute,
        headline: user.headline,
        status, // Now this will definitely be 'connected', 'pending', or 'none'
      };
    });

    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};